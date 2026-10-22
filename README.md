# Visor de Identificación de Predios CVP — Acueducto (EESSPP)

Visor web (Leaflet + Vite) para verificar cuáles de los predios/cuentas que la Empresa de
Acueducto de Bogotá (EAAB) registró a partir de las coordenadas reportadas por la CVP
corresponden efectivamente a predios de la **Dirección de Reasentamientos**.

## Qué muestra

- **2.976 predios reales** (cuentas contrato únicas), depurados del registro inflado de 25.812
  filas que el Acueducto generó por el cruce coordenada → múltiples direcciones.
- Cada predio clasificado como **CVP** (rojo) o **no identificado** (gris), según el cruce
  contra la capa `Reasentamientos.gpkg` por **Cuenta Contrato** (↔ `CuentaAcueducto`) y
  **CHIP (SAP)** (↔ `CHIP` / `CHIP_RESUELTO`).
- **967 predios** identificados como CVP.

## Localización territorial

Cada predio fue localizado por cruce espacial contra capas oficiales de Bogotá:

- **Localidad** — `localidades.geojson` (CVP).
- **UPL** (Unidad de Planeamiento Local, POT Decreto 555/2021) — Catastro Distrital (UAECD).
- **Barrio** (Barrio Común) — Catastro Distrital (UAECD).
- **Zona** — campo del registro del Acueducto.

## Filtros y cifras

- Segmentador **Propiedad**: Todos / Solo CVP / No identificados.
- Selectores: **Localidad, UPL, Barrio, Zona, Estrato** (se combinan en modo Y).
- **Búsqueda** por cuenta contrato, dirección o CHIP.
- Tarjetas **KPI** (predios, CVP, no identificados, % CVP) que se recalculan con el filtro.
- Panel **Cifras por territorio** con desglose por Localidad / UPL / Barrio / Zona
  (clic en una fila para filtrar).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Despliegue en Vercel

El repo ya trae `vercel.json` (framework Vite, salida `dist/`). Importar la carpeta en Vercel
o ejecutar `vercel`. Los GeoJSON viven en `public/data/` y se sirven como estáticos.

## Datos

- `public/data/predios.geojson` — 2.976 puntos (EPSG:4326) con todos los atributos y el
  resultado del cruce. Generado desde `data/EESSPP/EESSPP_Acueducto_Predios.gpkg`.

---
CVP · Dirección de Reasentamientos · Caja de la Vivienda Popular · Bogotá D.C. · 2026
