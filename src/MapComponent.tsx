import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  //const map = useRef<maplibregl.Map | null>(null);
  const map = useRef<any>(null);
  let hoveredPoleId: number | null = null; // Variable de estado para hover
  let hoverIds: number[] = []; // Lista de ids bajo hover

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapContainer.current as any,
      style:
        "https://ossokdmq.telecentro.net.ar/gis-react/data/style_oss_gis/style_oss_gis.json",
      center: [-58.37723, -34.61315],
      renderWorldCopies: true,
      zoom: 12,
    });
  }, []);

  useEffect(() => {
    if (!map.current || !mapContainer.current) return;

    map.current.on("load", () => {
      if (!map.current!.getLayer("pole_hover")) {
        map.current!.addLayer({
          id: "pole_hover",
          type: "circle",
          source: "pole",
          "source-layer": "pole",
          minzoom: 15,
          maxzoom: 21,
          filter: ["all", ["==", "estado", "No Iniciado"]],
          layout: { visibility: "visible" },
          paint: {
            "circle-color": "#000",
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              1,
              0.5,
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15, 6,
              16, 10,
              17, 14,
              18, 20,
              19, 30,
              20, 30,
              21, 60,
            ],
          },
        });
      }

      // Añadir la capa 'pole_hover_highlight' para manejar el highlight por ID
      if (!map.current!.getLayer("pole_hover_highlight")) {
        map.current!.addLayer({
          id: "pole_hover_highlight",
          type: "circle",
          source: "pole",
          "source-layer": "pole",
          minzoom: 15,
          maxzoom: 21,
          // Inicializa el filtro vacío
          filter: ["in", "id_objeto", ...hoverIds], // Inicialmente sin IDs
          layout: { visibility: "visible" },
          paint: {
            "circle-color": "#f00", // Color para resaltar
            "circle-opacity": 0.8,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15, 6,
              16, 10,
              17, 14,
              18, 20,
              19, 30,
              20, 30,
              21, 60,
            ],
          },
        });
      }

      // Función para actualizar el filtro de la capa de highlight
      const updateHoverHighlightLayer = () => {
        map.current!.setFilter("pole_hover_highlight", [
          "in",
          "id_objeto",
          ...hoverIds, // Añadir todos los ids bajo hover al filtro
        ]);
      };

      // Evento para detectar el hover
      map.current!.on("mousemove", "pole_hover", (e:any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const featureId = Number(feature.properties?.id_objeto); // Asegurar que el ID esté presente y sea un número

          console.log("Feature detectada bajo el mouse:", featureId);

          if (!isNaN(featureId)) {
            // Resetear el estado de hover anterior si existe otro
            if (hoveredPoleId !== null && hoveredPoleId !== featureId) {
              map.current!.setFeatureState(
                { source: "pole", id: hoveredPoleId, sourceLayer: "pole" },
                { hover: false }
              );
              console.log(`Estado hover del feature anterior (ID: ${hoveredPoleId}): false`);
            }

            // Establecer nuevo estado hover
            hoveredPoleId = featureId;
            map.current!.setFeatureState(
              { source: "pole", id: hoveredPoleId, sourceLayer: "pole" },
              { hover: true }
            );

            // Actualizar la lista de ids bajo hover y el filtro de la capa de highlight
            if (!hoverIds.includes(featureId)) {
              hoverIds.push(featureId);
              updateHoverHighlightLayer();
            }

            console.log(`Estado hover del feature actual (ID: ${hoveredPoleId}): true`);
          } else {
            console.warn("Feature sin ID válido encontrada.");
          }
        }
      });

      // Evento para eliminar el hover cuando el mouse sale de la capa
      map.current!.on("mouseleave", "pole_hover", () => {
        if (hoveredPoleId !== null) {
          map.current!.setFeatureState(
            { source: "pole", id: hoveredPoleId, sourceLayer: "pole" },
            { hover: false }
          );
          console.log(`Estado hover del feature (ID: ${hoveredPoleId}): false`);
        }

        // Eliminar el ID de la lista de hover y actualizar el filtro
        hoverIds = hoverIds.filter((id) => id !== hoveredPoleId);
        updateHoverHighlightLayer();

        // Restablecer estado hover a null
        hoveredPoleId = null;
      });
    });

    /* Cambio de coords */
    interface Feature {
      type: string;
      properties: Record<string, any>;
      geometry: {
          type: string;
          coordinates: number[];
      };
  }
    let isDragging = false;
let draggedFeature: Feature |null= null;
let draggedHoverFeature: Feature|null = null; 
let ids: string = '';
let movedFeatures: Feature[] = [];
let movedHoverFeatures: Feature[] = []; 
let movedHoverIds: string[] = []; 
let coords:any = null
let movedIds: string[] = [];
 
 
map.current.on('contextmenu', 'pole', (e: any) => {
  const coordinates = e.features[0].geometry.coordinates.slice();
  const properties = e.features[0].properties;
  ids = e.features[0].properties.id_objeto;

 
  draggedFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates,
    },
    properties: properties,
  };
 
  
  movedFeatures.push(draggedFeature);
  movedIds.push(properties.id_objeto);
 
  draggedHoverFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates, 
    },
    properties: { ...properties, id_objeto: properties.id_objeto + '_hover' }, 
  };
 
  movedHoverFeatures.push(draggedHoverFeature);
  movedHoverIds.push(draggedHoverFeature.properties.id_objeto);
 
  updateMapSourceAndLayer('temp-move-source', 'temp-move-layer', movedFeatures, '#FF0000'); // Pole original
  updateMapSourceAndLayer('temp-move-hover-source', 'temp-move-hover-layer', movedHoverFeatures, '#FF0000');
 
 
  isDragging = true;
  map.current.getCanvas().style.cursor = 'move';
});
 
map.current.on('mousemove', (e: any) => {
  if (isDragging && draggedFeature && draggedHoverFeature) {
    const newCoordinates = [e.lngLat.lng, e.lngLat.lat];  

 
    draggedFeature.geometry.coordinates = newCoordinates;
    draggedHoverFeature.geometry.coordinates = newCoordinates; 
    const movedFeature = map.current.queryRenderedFeatures({
      layers: ['pole'], 
    });
    movedFeature[0].geometry.coordinates = newCoordinates
    updateMapSourceAndLayer('temp-move-source', 'temp-move-layer', movedFeatures, '#FF0000'); 
    map.current.removeLayer('temp-move-layer');
    map.current.removeSource('temp-move-source');
  }
});
 
map.current.on('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    map.current.getCanvas().style.cursor = '';
/* 
    const movedFeature = map.current.queryRenderedFeatures({
      layers: ['pole'], 
    });
      const finalCoordinates = map.current.getSource('temp-move-source')._data.features[movedFeatures.length - 1].geometry.coordinates;
      coords = { lng: finalCoordinates[0], lat: finalCoordinates[1] };
      movedFeature[0].geometry.coordinates = finalCoordinates */     
 
/* 
      updateMapSourceAndLayer('temp-move-source', 'temp-move-layer', movedFeatures, '#FF0000'); 
      map.current.removeLayer('temp-move-layer');
      map.current.removeSource('temp-move-source');   */
  /*     changeCoordsPole(ids, coords)
        .then((res: any) => {
          if (res.success === true) {
            const source: any = newMap.getSource("pole");
            console.log(source);
           if (source) {
              source.setTiles(source.tiles); 
            }
            const source2: any = newMap.getSource("pole_en_planificacion");
            if (source2) {
              source2.setTiles(source2.tiles); 
            }
 
            
            newMap.removeLayer('temp-move-layer');
            newMap.removeSource('temp-move-source');  
          }
        })
        .catch((error: any) => {
          console.error("Error updating pole feature coordinates:", error);
        });  */
  }
});
 
function updateMapSourceAndLayer(sourceId: string, layerId: string, features: any[], color: string) {
  if (map.current.getSource(sourceId)) {
    map.current.getSource(sourceId).setData({
      type: 'FeatureCollection',
      features: features,
    });
  } else {
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features,
      },
    });
    if (map.current.getLayer('pole_hover')) {
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 10,
          'circle-color': color,
        },
      }, 'pole_hover'); 
    } else {
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 10,
          'circle-color': color,
        },
      });
    }
  }
}

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
};

export default MapComponent;
