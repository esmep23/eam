google.load('earth', '1');
var map;
var googleEarth;
var markers = [];
var material_inicial = 1;

var color_pivot;

var _id_material;
var _pathIcon;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        $("#geocomplete").geocomplete({
            map: "#map",
            details: "form ul",
            detailsAttribute: "data-geo",
            country: 'ec'
        });

        $("#find").click(function(){
            //$("#geocomplete").trigger("geocode");
            var coordenadas = $('#coordinates-place').html();
            console.log(coordenadas);
            if(coordenadas.length>0)
                buscarPorDireccion(coordenadas);
        });
        $('.link').live('tap', function() {
            url = $(this).attr("rel");
            loadURL(url);
        });
        setTimeout(function(){
            var alto_menu = $('#menu').css("top");
            var alto_mapa = $('#map-canvas').css("height");
            var alto_header = $('#header').css("height");
            var alto_footer = $('.footer').css("height");
            $('#menu').css("top",alto_menu);
            $('#map-canvas').css("height",alto_mapa);
            $('#header').css("height",alto_header);
            $('.footer').css("height",alto_footer);
        },1000);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        cargarMaterial();
    }
};

function loadURL(url) {
    //alert(url);
    navigator.app.loadUrl(url, {
        openExternal: false
    });
    return false;
}

function buscarPorDireccion(coordenadas){
    //alert(_lat_search+' - '+_lon_search);
    map.setZoom(15);
    //var latLng = new google.maps.LatLng(_lat_search, _lon_search);
    var coor = coordenadas.split(',')
    var latLng = new google.maps.LatLng(coor[0],coor[1]);
    map.panTo(latLng);
    $('#puntos').slideUp("slow");
}

function init() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: new google.maps.LatLng(-0.1806532, -78.4678382),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true
    });
    //googleEarth = new GoogleEarth(map);
    //setTimeout('googleEarth.showEarth_();', 2500);
    //google.maps.event.addListenerOnce(map, 'tilesloaded', addOverlays);
    var mapa = document.getElementById('map');
}

function cambiarMaterial(id_material) {
    var imagen = $(".material_actual");
    _id_material = id_material;
    setAllMap(null);
    $.ajax({
        type: "POST",
        url: "http://maruridigitaldev.com/mae/service_recicla/get_material.php",
        data: {
            id: id_material
        },
        dataType: "json",
        success: function(data) {
            $.each(data, function (key, value){
                $('#titulo_material').html(value.nombre);
                //$(".material_actual").css('background-image', 'url(img/materiales/' + value.url_imagen + ')');
                $('.reciclaje').css("background-color","#"+value.url_color);
                if(value.url_blog.length>0){
                    //$('#info-blog').attr('href','http://www.reciclaecuador.com.ec/blog/'+value.url_blog);
                    $('#info-blog').attr('data-rel','http://www.reciclaecuador.com.ec/blog/'+value.url_blog);
                    $('#info-blog').on('click', function(){
                        window.open('http://www.reciclaecuador.com.ec/blog/'+value.url_blog,'_system','location=yes');
                    });
                }else{
                    $('#info-blog').attr('data-rel','http://www.reciclaecuador.com.ec/blog/');
                    $('#info-blog').on('click', function(){
                        window.open('http://www.reciclaecuador.com.ec/blog/','_system','location=yes');
                    });
                }
                color_pivot = value.url_color;
                _pathIcon = "img/"+color_pivot+".png";
                cargarPuntos();
                show_materiales();
            });
        }
    });
}

function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function show_materiales() {
    if ($('#puntos').css('display') == 'none') {
        $('#puntos').slideDown('slow');
    } else {
        $('#puntos').slideUp("slow");
    }
}

function cargarMaterial() {
    //var i = material_inicial;
     $('.lista_materiales li').remove();
    $.ajax({
        type: "POST",
        url: "http://maruridigitaldev.com/mae/service_recicla/get_material.php",
        /*data: {
            id: i
        },*/
        dataType: "json",
        success: function(data) {
            $.each(data, function (key, value){
                //console.log(value.id_material+' - '+value.nombre);
                $('.lista_materiales').append('<li onclick="cambiarMaterial('+value.id_material+')">'+value.nombre+'</li>');
                //$('#lista_materiales_sel').append('<option value="'+value.id_material+'">'+value.nombre+'</li>');
            });
            //$('#puntos').nanoScroller();
            setTimeout(function(){
                $('.lista_materiales li:first-child').click();
            },500);
        }
    });
}

function cargarPuntos() {
    $.ajax({
        type: "POST",
        url: "http://maruridigitaldev.com/mae/service_recicla/get_points.php",
        data: {
            id: _id_material
        },
        dataType: "json",
        success: function(data) {
            $.each(data, function (key, value){
                //console.log(value.empresa+' - '+value.id_localizacion+' lat:'+value.latitud+' lon:'+value.longitud);
                crearPunto(value.latitud.replace(/,/g , "."),value.longitud.replace(/,/g , "."),value.id_localizacion,value.empresa);
            });
        }
    });
}

var _infowindow;
var current_marker = null;
function crearPunto(lat, lon, id_localizacion, empresa) {
    //console.log(lat+' | '+lon+'-'+id_localizacion);
    var latLng = new google.maps.LatLng(lat, lon);
    var marker = new google.maps.Marker({
        position: latLng,
        draggable: false,
        icon: _pathIcon,
        title: empresa,
        id: id_localizacion
    });

    google.maps.event.addListener(marker, 'click', function() {
        openWindowInfo(marker);
    });

    markers.push(marker);
    marker.setMap(map);
}

function openWindowInfo(marker){
    show_materiales();
    $.ajax({
        type: "POST",
        url: "http://maruridigitaldev.com/mae/service_recicla/get_point_by_id.php",
        data: {
            id: marker.get('id')
        },
        dataType: "json",
        success: function(data) {
            marker.info = null;
            $.each(data, function (key, value){
                if (current_marker !== null) {
                    current_marker.close();
                }
                var html = '<div class="box-globo"><p class="titulo_empresa">'+value.empresa+'<p><p class="titulo_ciudad">'+value.ciudad+'<p><p class="titulo_direccion">'+value.direccion+'<p><hr><p class="titulo_horario">Horarios: </p><p class="titulo_horario">'+value.horario_dia+' - '+value.horario_hora+'</p><hr><p class="titulo_horario">Observaciones: </p><p class="titulo_horario">'+value.info_adicional+'</div>';
                marker.info = new google.maps.InfoWindow({
                    content: html
                });
                marker.info.open(map, marker);
                current_marker = marker.info;
            });
            setTimeout(function(){
                $('.titulo_empresa').css("color","#"+color_pivot);
            
                $('p').each(function() {
                    var $this = $(this);
                    if($this.html().replace(/\s|&nbsp;/g, '').length == 0)
                        $this.remove();
                });
            },10);
        }
    });
}

function addInfowindow(marker, infowindow) {
    _infowindow.close();
    console.log(_infowindow);
    google.maps.event.addListener(marker, 'click', function() {
        var _id2 = marker.get('id');
        console.log(_id2);
        infowindow.open(map, marker);
    });
}

google.maps.event.addDomListener(window, 'load', init);