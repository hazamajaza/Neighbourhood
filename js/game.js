var json, selected = -1,
player = {
    money: 0,
    name: "Player",
    armies: 0,
    happinessAvg: 0,
    regions: 0,
    controlOf: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
},
initialize = function () {

    if (typeof localStorage.getItem('neighbourhoodData') === 'undefined' && JSON.parse(localStorage.getItem('neighbourhoodData')).paths[0][0][0] == 1.7){
        var data = JSON.parse(localStorage.getItem('neighbourhoodData'));
    }else{
        var data;
        $.ajax({
            dataType: "json",
            url: 'js/data.json',
            async: false,
            success: function(d){data=d}
        });
        localStorage.setItem('neighbourhoodData',JSON.stringify(data));
    }
    window.paths = data.paths;
    window.defaultJSON = data.defaultJSON;
    window.buildings = data.buildings;
    setupMap();
    if (typeof localStorage.getItem("newGame") == "string") {
        setupNewGame();
    } else {
        j = JSON.parse(localStorage.getItem("saveGame"));
        json = j.json;
        player = j.player
    }
    for (var i = 0; i < 12; i++) {
        if (player.controlOf[i] == true) {
            player.happinessAvg += json[i].happiness;
            player.regions++;
        }
        addPathsToMap(i);
        json[i].happiness = calculateHappinessForRegion(i);
        json[i].oppression = calculateOppressionForRegion(i);
    }
    player.happinessAvg /= player.regions;
    $("#playername").text(player.name);
    $("#totalarmies").text(player.armies);
    
    updateDisplay();
}, setupMap = function () {
    var mapSettings = {
        zoom: 5,
        center: new google.maps.LatLng(56.46, -7.015),
        mapTypeControlOptions: {
            mapTypeIds: []
        },
        maxZoom: 8,
        minZoom: 5,
        panControl: 0,
        streetViewControl: 0,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    },
    map = new google.maps.Map(document.getElementById("map_canvas"), mapSettings);
    window.addPathsToMap = function (a) {
        var tempLatLngs = [];
        for (i = 0; i < paths[a].length; i++) {
            tempLatLngs.push(new google.maps.LatLng(50+paths[a][i][0], paths[a][i][1]))
        }
        json[a].poly = new google.maps.Polygon({
            path: tempLatLngs,
            strokeColor: "#222",
            strokeWeight: "2",
            fillColor: "#ff0000",
            fillOpacity: "0.5",
            map: map
        });
        google.maps.event.addListener(map, "click", function () {
            updateStatDisplay(-1)
        });
        google.maps.event.addListener(json[a].poly, "click", function () {
            updateStatDisplay(a)
        })
    };

    map.mapTypes.set("Minimal Map",new google.maps.StyledMapType([{stylers:[{visibility:"off"}]},{featureType:"landscape",stylers:[{visibility:"on"},{color:"#ccc"}]},{featureType:"water",stylers:[{visibility:"simplified"},{color:"#408099"}]},{featureType:"landscape"}],{name:"Minimal Map"}))
    map.setMapTypeId("Minimal Map")
}, setupNewGame = function () {
    var newGameData = JSON.parse(localStorage.getItem("newGame"));
    player.name = newGameData.name;
    player.controlOf[newGameData.region] = true;
    localStorage.removeItem("newGame");
    window.json = defaultJSON;
    player.money += json[newGameData.region].gva;
    for (x = 0; x < 12; x++) {
        json[x].armies = Math.floor(Math.random() * 5) + json[x].crime - 20
    }
    player.armies += json[newGameData.region].armies;
    save()
}, eraseGame = function () {
    if (confirm("Are you sure?")) {
        localStorage.removeItem("saveGame");
        localStorage.removeItem("newGame");
        window.location = "index"
    }
}, getDefaultModalText = function () {
    return "<p>What would you like to build/destroy in " + json[selected].name + '? There are:</p><table><tr class="bb"><td><a href="#" data-e="1" data-b="schools" class="btn btn-mini btn-success">Build school</a></td> <td><strong>' + json[selected].schools + '</strong> Schools</td><td><a href="#" class="btn btn-mini btn-danger" data-e="-1" data-b="schools">Destroy school</a></td></tr><tr class="bb"><td><a href="#" data-e="1" data-b="hospitals" class="btn btn-mini btn-success">Build hospital</a></td><td><strong>' + json[selected].hospitals + '</strong> Hospitals</td><td><a href="#" class="btn btn-mini btn-danger" data-e="-1" data-b="hospitals">Destroy hospital</a></td></tr><tr class="bb"><td><a href="#" data-e="1" data-b="armies" class="btn btn-mini btn-success">Build soldiers</a></td><td><strong>' + player.armies + '</strong> Soldiers</td><td><a href="#" class="btn btn-mini btn-danger" data-e="-1" data-b="armies">Destroy soldiers</a></td></tr></table>'
},
activateBuildModal = function (a) {
    a.preventDefault();
    e = $(this).data("e");
    b = $(this).data("b");
    if (json[selected][b] > buildings[b].amount && e == -1 && buildings[b].cost / 4 <= player.money || buildings[b].cost <= player.money && e == 1) {
        b == "armies" ? player[b] += e * buildings[b].amount : json[selected][b] += e * buildings[b].amount;
        e == 1 ? player.money -= buildings[b].cost : player.money -= buildings[b].cost / 4;
        $("#currentmoney").text(player.money);
        $("#modal .modal-body").html(getDefaultModalText());
        $("#modal .btn-success,#modal .btn-danger").click(build);
        json[selected].happiness = calculateHappinessForRegion(selected);
        json[selected].oppression = calculateOppressionForRegion(selected);
        updateStatDisplay(selected);
        updateDisplay();
        save()
    }
}, updateStatDisplay = function (a) {
    if (a > -1) {
        selected = a;
        var b = "<h1>" + json[a].name + "</h1><h2>Stats</h2><ul><li><label>Population: </label>" + json[a].population + "<li><label>Population Density: </label>" + json[a].density + "<li><label>Money: </label>&pound;" + json[a].gva + "<li><label>Crime: " + json[a].crime + "<li><label>Soldiers: </label>" + json[a].armies + "</li><li><label>Schools: </label>" + json[a].schools + "<li><label>Hospitals: </labels>" + json[a].hospitals + '</ul><ul id="bars"><li class="tip" title="Happiness of this region"><i class="icon-minus icon-large"></i><span id="happiness" class="bar"><span style="width: ' + json[a].happiness + '%;"></span></span><i class="icon-plus icon-large"></i></li><li class="tip" title="Oppression of this region"><i class="icon-bolt icon-large"></i><span id="oppression" class="bar"><span style="width: ' + json[a].oppression + '%;"></span></span><i class="icon-bolt icon-large"></i></li></ul>';
        player.controlOf[selected] == true ? b = b + '<a class="sideB btn tip" title="Build something in this region" href="javascript:modal();">Build</a>' : b = b + '<a class="sideB btn tip" title="Take over this region" href="javascript:invadeModal();">Invade</a>';
        $(".stats").html(b);
    } else {
        selected = -1;
        $(".stats").html("<h1>No selection</h1>")
    }
}, modal = function () {
    $("#modal h3").html(json[selected].name);
    $("#modal .modal-body").html(getDefaultModalText());
    $("#modal").modal("show");
    $("#modal .btn-success,#modal .btn-danger").click(activateBuildModal)
}, calculateHappinessForRegion = function (a) {
    var region = json[a];
    h=50 -region.crime/6 +region.schools / region.population * 5e4 + region.hospitals / region.population * 5e5 + Math.pow(region.gva, 8) * 6e-35;
    
    if (region.density > 150) {
        h -= Math.sqrt(region.density - 150)
    }
    else if (region.density < 100) {
        h -= (100 - region.density) / 4
    }
    if (h > 100) {
        h = 100
    }
    if (h < 0) {
        h = 0
    }
    return Math.round(h)
    
}, calculateOppressionForRegion = function (a) {
    o = 50;
    var b = json[a];
    o += Math.sqrt(b.density) / 3.5;
    o -= b.schools / b.population * 2e3 + b.hospitals / b.population * 15e5;
    if (o > 100) {
        o = 100
    }
    if (o < 0) {
        o = 0
    }
    return o
}, updateDisplay = function () {
    player.regions = 0;
    for (i = 0; i < player.controlOf.length; i++) {
        if (player.controlOf[i] == true) {
            json[i].poly.setOptions({
                fillColor: "#2f2"
            });
            player.regions++
        }
    }
    $("#currentregions").text(player.regions);
    $("#currentmoney").text(player.money);
    $("#totalarmies").text(player.armies)
}, save = function () {
    j = {
        player: player,
        json: json
    };
    localStorage.setItem("saveGame", JSON.stringify(j, function (a, b) {
        if (a == "poly") return undefined;
        else return b
    }))
}, invadeRegion = function (a) {
    var b = player.armies + Math.ceil(player.armies / 20 * (player.regions - 1));
    var c = json[selected].armies;
    var d = Math.abs(b - c);
    var e = ~~ (player.armies / d * 3);
    if (c + ~~ (Math.random() * 6) - 3 > b * .8) {
        e *= 4;
        e += Math.floor(Math.random() * 5);
        $("#invadeModal .alert").addClass("alert-error");
        $("#invadeModal .alert h4").text("Invading was unsuccessful. You lost " + e + " men.");
        $("#invadeModal .modal-footer").html('<a href="#" class="btn" data-dismiss="modal">Close</a>')
    } else {
        $("#invadeModal .alert").addClass("alert-success");
        $("#invadeModal .alert h4").text("Invading was successful. You lost " + e + " men.");
        $("#invadeModal .modal-footer").html('<a href="#" class="btn" onclick="player.controlOf[selected] = true;player.money += Math.round(json[selected].gva * (1+((json[selected].happiness / 500) + (json[selected].oppression / 250))));" data-dismiss="modal">Close</a>');
        player.controlOf[selected] = true;
        player.money += json[selected].gva
    }
    oldArmies = player.armies;
    player.armies -= e;
    if (player.armies < ~~ (oldArmies / 3)) player.armies = ~~ (player.armies / 3);
    if (player.armies < 0) player.armies = 0;
    updateDisplay();
    save()
}, invadeModal = function () {
    var a;
    var b = player.armies + Math.ceil(player.armies / 20 * (player.regions - 1));
    var c = json[selected].armies;
    b < c ? a = "unsuccessful" : a = "successful";
    $("#invadeModal h3").html(json[selected].name);
    $("#invadeModal .modal-body").html("You have <strong>" + player.armies + "</strong> armies. " + json[selected].name + " has <strong>" + json[selected].armies + "</strong> armies. Based on the average army size for all of the areas you own, this means that your takeover is likely to be <strong>" + a + '</strong>. Would you like to invade?<div class="alert"><h4>Blah</h4></div>');
    $("#invadeModal .modal-footer").html('<a href="#" class="btn" data-dismiss="modal">Cancel</a> <a href="#" onclick="invadeRegion(' + selected + ');" class="btn btn-primary" >Invade</a>');
    $("#invadeModal").modal("show")
}

