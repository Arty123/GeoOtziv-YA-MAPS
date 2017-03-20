require('./index.css');

ymaps.ready(init);
var myMap, coords;

var mapContainer = document.getElementById('map');



function init(){
    myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 7
    });

    var myCollection = new ymaps.GeoObjectCollection();

    mapContainer.addEventListener('click', function(e) {

    var getPointData = function (param, response) {
        return {
            balloonContentHeader: '<strong> ' + param[0] + '</strong>',
            balloonContentBody: '<a data-coords="' + param[2] + ',' +  param[3] +'" href="#">' + response.GeoObject.description + ' ' + response.GeoObject.name + '</a>',
            balloonContentFooter: 'метка <strong>' + param[1] + '</strong>'
        };
    }

    var getPointOptions = function () {
        return {
            preset: 'islands#violetIcon'
        };
    }

    var getPointAddress = function(coords) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
                url = 'https://geocode-maps.yandex.ru/1.x/?format=json&kind=house&results=1&geocode='
                + coords[1].toPrecision(6) + ','+ coords[0].toPrecision(6);

            xhr.open('GET', url);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var jsonResponse = JSON.parse(xhr.responseText);

                        if (jsonResponse.response.GeoObjectCollection.featureMember) {
                            resolve(jsonResponse.response.GeoObjectCollection.featureMember[0]);
                        }
                    } else {
                        reject('Какая-то ошибка');
                    }
                }
            }

            xhr.send(null);
        })
    }

    if (e.target.dataset.add) {
          getPointAddress(coords)
          .then(function(response) {
              var myPlacemark = new ymaps.Placemark(
                  [coords[0].toPrecision(6), coords[1].toPrecision(6)],
                    getPointData(['Name', Math.random().toPrecision(2), coords[0].toPrecision(6), coords[1].toPrecision(6)], response),
                    getPointOptions()
              );

              myMap.geoObjects.add(myPlacemark);

              // myMap.balloon.close();

              clusterer.add(myPlacemark);
          })
          .catch(function() {alert('Не могу определить точный адрес!')});
      }
    })

    // создадим массив геообъектов
    myGeoObjects = [];
    myGeoObjects[0] = new ymaps.GeoObject({
        geometry: {type: "Point", coordinates: [56.034, 36.992]},
        properties: {
            clusterCaption: 'Геообъект №1',
            balloonContentBody: 'Содержимое балуна геообъекта №1.'
        }
    });
    myGeoObjects[1] = new ymaps.GeoObject({
        geometry: {type: "Point", coordinates: [56.021, 36.983]},
        properties: {
            clusterCaption: 'Геообъект №2',
            balloonContentBody: 'Содержимое балуна геообъекта №2.'
        }
    });

// Создаем собственный макет с информацией о выбранном геообъекте.
var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
    // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
    '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
);

// создадим кластеризатор и запретим приближать карту при клике на кластеры
var clusterer = new ymaps.Clusterer({
    clusterDisableClickZoom: true,
    clusterOpenBalloonOnClick: true,
    // Устанавливаем стандартный макет балуна кластера "Карусель".
    clusterBalloonContentLayout: 'cluster#balloonCarousel',
    // Устанавливаем собственный макет.
    clusterBalloonItemContentLayout: customItemContentLayout,
    // Устанавливаем режим открытия балуна.
    // В данном примере балун никогда не будет открываться в режиме панели.
    clusterBalloonPanelMaxMapArea: 0,
    // Устанавливаем размеры макета контента балуна (в пикселях).
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 130,
    // Устанавливаем максимальное количество элементов в нижней панели на одной странице
    clusterBalloonPagerSize: 5,
    preset: 'islands#invertedVioletClusterIcons'
    // Настройка внешего вида нижней панели.
    // Режим marker рекомендуется использовать с небольшим количеством элементов.
    // clusterBalloonPagerType: 'marker',
    // Можно отключить зацикливание списка при навигации при помощи боковых стрелок.
    // clusterBalloonCycling: false,
    // Можно отключить отображение меню навигации.
    // clusterBalloonPagerVisible: false
});
    clusterer.add(myGeoObjects);
    myMap.geoObjects.add(clusterer);

    // Поскольку по умолчанию объекты добавляются асинхронно,
    // обработку данных можно делать только после события, сигнализирующего об
    // окончании добавления объектов на карту.
    clusterer.events.add('objectsaddtomap', function () {

        // Получим данные о состоянии объекта внутри кластера.
        var geoObjectState = cluster.getObjectState(myGeoObjects[1]);
        // Проверяем, находится ли объект находится в видимой области карты.
        if (geoObjectState.isShown) {

            // Если объект попадает в кластер, открываем балун кластера с нужным выбранным объектом.
            if (geoObjectState.isClustered) {
                geoObjectState.cluster.state.set('activeObject', myGeoObjects[1]);
                geoObjectState.cluster.balloon.open();

            } else {
                // Если объект не попал в кластер, открываем его собственный балун.
                myGeoObjects[1].balloon.open();
            }
        }
  });

    myMap.events.add('click', function (e) {
    var getPointAddress = function(coords) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
                url = 'https://geocode-maps.yandex.ru/1.x/?format=json&kind=house&results=1&geocode='
                + coords[1].toPrecision(6) + ','+ coords[0].toPrecision(6);

            xhr.open('GET', url);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var jsonResponse = JSON.parse(xhr.responseText);

                        if (jsonResponse.response.GeoObjectCollection.featureMember) {
                            resolve(jsonResponse.response.GeoObjectCollection.featureMember[0]);
                        }
                    } else {
                        reject('Какая-то ошибка');
                    }
                }
            }

            xhr.send(null);
        })
    }
    if (!myMap.balloon.isOpen()) {
        coords = e.get('coords');
        getPointAddress(coords)
            .then(
                function(response) {
                  myMap.balloon.open(coords, {
                      contentHeader: response.GeoObject.description + ' ' + response.GeoObject.name,
                      contentBody:'<p>Кто-то щелкнул по карте.</p>' +
                          '<p>Координаты щелчка: ' + [
                          coords[0].toPrecision(6),
                          coords[1].toPrecision(6)
                          ].join(', ') + '</p>',
                      contentFooter:'<sup><a data-add="true">Добавить метку</a></sup>'
                  });
                }
            )
            .catch()
    }
    else {
        myMap.balloon.close();
    }

    // Обработка события, возникающего при щелчке
    // правой кнопки мыши в любой точке карты.
    // При возникновении такого события покажем всплывающую подсказку
    // в точке щелчка.
    myMap.events.add('contextmenu', function (e) {
        myMap.hint.show(e.get('coordPosition'), 'Кто-то щелкнул правой кнопкой');
    });
});
}
