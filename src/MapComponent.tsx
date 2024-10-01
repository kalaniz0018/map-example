import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
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
      map.current!.on("mousemove", "pole_hover", (e) => {
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

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
};

export default MapComponent;
