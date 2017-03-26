"use strict"

require('./index.css');

ymaps.ready(init);
var myMap, coords;

var mapContainer = document.getElementById('map'),
    myBaloons = [], objectBaloon = {},
    popupLayout = document.getElementById('popup'),
    reviewsList = document.getElementById('reviews-list'),
    clickY, clickX,
    popupAddress = document.getElementById('popup-address'),
    popupBtn = document.getElementById('btn'),
    closeBtn = document.getElementById('btn-close'),
    reviewsLayout;

var getPointData = function (param, response) {
    return {
        balloonContentHeader: '<strong> ' + param[0] + '</strong>', 
        balloonContentBody: '<a data-review="true" data-coords="' + param[2] + ',' +  param[3] + '" data-address="' + response.GeoObject.description + ' ' + response.GeoObject.name +'" href="#">' + response.GeoObject.description + ' ' + response.GeoObject.name + '</a>', 
        balloonContentFooter: '<div><strong>' + param[1] + '</strong></div><div style="margin: 8% 0% 0% 38%;">'+param[4]+'</div>'
    };
}

function getPointOptions() {
    return {
        preset: 'islands#violetIcon',
        hasBalloon: false
    };
}

function checkCoords(coords) {
    if ((typeof coords[0] === "string") && (typeof coords[1] === "string")) {
        var lat = coords[0],
            lng = coords[1];

        return [lat, lng]
    } else {
        var lat = coords[0].toPrecision(6),
            lng = coords[1].toPrecision(6);

        return [lat, lng]
    }
}

function getPointAddress(coords) {

    coords = checkCoords(coords);

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest(),
            url = 'https://geocode-maps.yandex.ru/1.x/?format=json&kind=house&results=1&geocode='
                + coords[1] + ','+ coords[0];
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
        };

        xhr.send(null);
    })
}

function createReview(item) {
    var templateFn = require('../review-template.hbs');

    return templateFn({
        item: item
    });
}

function createBaloon(address, lastReviews) {
    var templateFn = require('../baloon-template.hbs');

    return templateFn({
        address: address,
        lastReviews:  lastReviews
    });
}

function appendReview(listId, item) {
    var review = createReview(item),
        list = document.getElementById(listId);

    list.innerHTML += review;
}

function init() {
    myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 7
    });

    // Создаем собственный макет с информацией о выбранном геообъекте.
    var customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class="ballon_header">{{ properties.balloonContent|raw }}</h2>' +
        '<div class="ballon_body">{{ properties.balloonContentBody|raw }}</div>' +
        '<div class="ballon_footer">{{ properties.balloonContentFooter|raw }}</div>'
    );

    var clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        // clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5,
        preset: 'islands#invertedVioletClusterIcons'
    });

    clusterer.events.add('objectsaddtomap', function () {

        var geoObjectState = cluster.getObjectState(myGeoObjects[1]);
        if (geoObjectState.isShown) {

            if (geoObjectState.isClustered) {
                geoObjectState.cluster.state.set('activeObject', myGeoObjects[1]);
                geoObjectState.cluster.balloon.open();

            } else {
                myGeoObjects[1].balloon.open();
            }
        }
    });

    myMap.geoObjects.add(clusterer);

    mapContainer.addEventListener('click', function(e) {
        // Get click position
        clickY = e.pageY;
        clickX = e.pageX;
        console.log(clickY, clickX)
        if (e.target.dataset.review) {
            e.preventDefault();

            var coordsOfCurrentAddress = e.target.dataset.coords.split(','),
                reviewsOfCurrentAddress = [];

            popupLayout.style.display = 'none';

            myBaloons.forEach(function(item, i, myBaloons) {
                if (item.address === e.target.dataset.address) {
                    reviewsOfCurrentAddress.push(item);
                }
            });

            myMap.balloon.close();

            reviewsLayout = createReview(reviewsOfCurrentAddress);
            reviewsList.innerHTML = '';
            reviewsList.innerHTML += reviewsLayout;
            popupAddress.innerText = e.target.dataset.address;
            popupAddress.setAttribute('title', e.target.dataset.address);

            popupLayout.style.display = 'block';
            popupLayout.style.top = clickY + 'px';
            popupLayout.style.left = clickX + 'px';

            popupBtn.dataset.coords = e.target.dataset.coords;

            e.target.dataset.coords = coords[0].toPrecision(6) + ',';

            reviewsOfCurrentAddress = [];
        }
    });

    myMap.events.add('click', function (e) {
        if (!myMap.balloon.isOpen()) {
            coords = e.get('coords');
            popupLayout.style.display = 'none';
            coords = checkCoords(coords);

            popupBtn.dataset.coords = coords;

            myMap.balloon.close();
            getPointAddress(coords)
                .then(
                    function(response) {
                        var address = response.GeoObject.description + ' ' + response.GeoObject.name,
                            lastReviews = [];

                        myBaloons.forEach(function(item, i, myBaloons) {
                            if (item.address === address) {
                                lastReviews.push(item);
                            }
                        });
                        
                        reviewsLayout = createReview(lastReviews);
                        reviewsList.innerHTML = '';
                        reviewsList.innerHTML += reviewsLayout;
                        popupAddress.innerText = address;
                        popupAddress.setAttribute('title', address);

                        popupLayout.style.display = 'block';
                        popupLayout.style.top = clickY + 'px';
                        popupLayout.style.left = clickX + 'px';

                        lastReviews = [];
                    }
                )
                .catch()
        }
        else {
            myMap.balloon.close();
        }
    });

    popupLayout.addEventListener('click', function(e) {
        if (e.target.dataset.add) {
            e.preventDefault();

            var inputName = document.getElementById('inputName').value,
                inputPlace = document.getElementById('inputPlace').value,
                inputReview = document.getElementById('inputReview').value;


            if ((typeof coords[0] === "string") && (typeof coords[1] === "string")) {
                var lat = coords[0],
                    lng = coords[1];
            } else {
                var lat = coords[0].toPrecision(6),
                    lng = coords[1].toPrecision(6);
            }

            if (e.target.dataset.coords) {
                coords = e.target.dataset.coords.split(',');

                var lat = coords[0],
                    lng = coords[1];
            }

            getPointAddress(coords)
                .then(
                    function(response) {
                        var myPlacemark,
                            lastReviews = [],
                            address = response.GeoObject.description + ' ' + response.GeoObject.name;

                        objectBaloon.coords = [lat, lng];
                        objectBaloon.address = address;
                        objectBaloon.name = inputName;
                        objectBaloon.review = inputReview;
                        objectBaloon.place = inputPlace;
                        objectBaloon.date = new Date().toLocaleString();

                        myBaloons.push(objectBaloon);

                        myBaloons.forEach(function(item, i, myBaloons) {
                            if (item.address === address) {
                                lastReviews.push(item);
                            }
                        });

                        myPlacemark = new ymaps.Placemark(
                            [lat, lng],
                            getPointData([inputPlace, inputReview, lat, lng, objectBaloon.date], response),
                            getPointOptions()
                        );

                        myMap.geoObjects.add(myPlacemark);

                        reviewsLayout = createReview(lastReviews);
                        reviewsList.innerHTML = reviewsLayout;

                        objectBaloon = {};

                        clusterer.add(myPlacemark);

                        myPlacemark.events.add('click', function (e) {
                            var baloonCoords = e.get('target').geometry.getCoordinates(),
                                lastReviews = [];

                            myBaloons.forEach(function(item, i, myBaloons) {
                                if ((item.coords[0] === baloonCoords[0]) && (item.coords[1] === baloonCoords[1])) {
                                    lastReviews.push(item);
                                }
                            });

                            reviewsLayout = createReview(lastReviews);
                            reviewsList.innerHTML = '';
                            reviewsList.innerHTML += reviewsLayout;
                            popupAddress.innerText = address;
                            popupAddress.setAttribute('title', address);
                            popupBtn.dataset.coords = baloonCoords;

                            popupLayout.style.display = 'block';
                            popupLayout.style.top = clickY + 'px';
                            popupLayout.style.left = clickX + 'px';

                            lastReviews = [];
                        });
                    }
                )
                .catch(function() {alert('Не могу определить точный адрес!')});
        }
    });

    myMap.events.add('boundschange', function (e) {
        popupLayout.style.display = 'none';
    });

    myMap.events.add('actiontick', function (e) {
        popupLayout.style.display = 'none';
    });

    closeBtn.addEventListener('click', function (e) {
        popupLayout.style.display = 'none';
    })
}
