import { useEffect, useRef, useState } from 'react';
import './App.css';
import '@tomtom-international/web-sdk-maps/dist/maps.css'
import tt from '@tomtom-international/web-sdk-maps';
import ttapi from '@tomtom-international/web-sdk-services';

const App = () => {
  const mapElement = useRef();
  const [map,setMap] = useState({});
  const [longitude,setLongitude] = useState(72.8523);
  const [latitude,setLatitude] = useState(19.2381);
  const convertToPoints = (lnglat) => {
    return{
      point:{
        latitude : lnglat.lat,
        longitude: lnglat.lng,
      }
    }
  }

  const addDeliveryMarker = (lngLat,map) =>{
    const element = document.createElement('div')
    element.className='marker-delivery'
    new tt.Marker({
      element: element
    }).setLngLat(lngLat).addTo(map)
  }

  const drawRoute = (geoJson,map) => {
    if(map.getLayer('route')){
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source : {
        type: 'geojson',
        data: geoJson
      },
      paint:{
        'line-color':'red',
        'line-width':6
      }
    })
  }

  useEffect(() =>{

    const origin = {
      lng : longitude,
      lat : latitude,
    }
    const destinations = [];
    let map = tt.map({
      key: keyhere,
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow : true
      },
      center: [longitude,latitude],
      zoom: 14
      });
      setMap(map)

      const addMarker = () =>{
        const popupOffset = {
          bottom: [0,-25]
        }
        const popup = new tt.Popup({offset: popupOffset}).setHTML('This is you!')

        const element = document.createElement('div');
        element.className = 'marker';

        const marker = new tt.Marker({
          draggable : true,
          element : element,
        })
        .setLngLat([longitude,latitude])
        .addTo(map)

        marker.on('dragend',()=>{
          const lngLat = marker.getLngLat();
          setLatitude(lngLat.lat);
          setLongitude(lngLat.lng);
        })
        marker.setPopup(popup).togglePopup();
      }
      addMarker();

      const sortDestinations = (locations) => {
        const pointsForDestinations = locations.map((destination) => {
          return convertToPoints(destination);
        })
            const callParameters = {
            key: keyhere,
            destinations: pointsForDestinations,
            origins: [convertToPoints(origin)]
          }
          return new Promise((resolve,reject) => {
            ttapi.services.matrixRouting(callParameters)
            .then((matrixAPIResults) => {
              const results = matrixAPIResults.matrix[0];
              const resultsArray = results.map((result,index)=>{
                return{
                  location: locations[index],
                  drivingtime: result.response.routeSummary.travelTimeInSeconds,
                }
              })
              resultsArray.sort((a,b)=>{
                return a.drivingtime - b.drivingtime
              })
              const sortedLocations = resultsArray.map((result)=>{
                return result.location
              })
              resolve(sortedLocations);
            })
          })
      }
      const recalculateRoutes = () => {
        sortDestinations(destinations).then((sorted)=>{
          sorted.unshift(origin);
          ttapi.services.calculateRoute({
            key: keyhere,
            locations: sorted,
          })
          .then((routeData)=>{
            const geoJson = routeData.toGeoJson();
            drawRoute(geoJson,map);
          })
        })
      }
      
      map.on('click',(e)=>{
        destinations.push(e.lngLat);
        addDeliveryMarker(e.lngLat,map);
        recalculateRoutes();
      })
      return () => map.remove();
  },[longitude,latitude])

  return (
    <>
    {map &&<div className="App">
      <div ref={mapElement} className="mapDiv">
        <div className='search-bar'>
          <h1>Where to?</h1>
          <input 
            type="text"
            id="longitude"
            className="longitude"
            placeholder="Enter Longitude"
            onChange={(e) => {setLongitude(e.target.value)}}
          />
          <input 
            type="text"
            id="latitude"
            className="latitude"
            placeholder="Enter Latitude"
            onChange={(e) => {setLatitude(e.target.value)}}
          />
        </div>
      </div>
    </div>}
    </>
  );
}

export default App;
