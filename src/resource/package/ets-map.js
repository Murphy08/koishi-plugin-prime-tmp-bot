const TMP_MAP_ZOOM_LEVELS = 3;
const TMP_MAP_TILE_SIZE = 1000;
const TMP_EMPTY_TILE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

const mapConfig = {
  ets: {
    tileUrl: 'https://map-cdn.krashnz.com/ets2map/ets2/v1.60',
    tileOffset: { x: -22, y: -22 },
    tileRange: { xMin: -100, xMax: 88, yMin: -124, yMax: 91 },
    calculateMapCoordinate(x, y) {
      x = Number(x);
      y = Number(y);
      // TruckersMP compresses the ETS2 map around the UK on its public map.
      if (x < -30100 && y < -0.14 * x - 10040) {
        return [0.75 * x - 8337, 0.75 * y - 1000];
      }
      return [x, y];
    }
  },
  promods: {
    tileUrl: 'https://map-cdn.krashnz.com/ets2map/promods/v2.80',
    tileOffset: { x: -145, y: -18 },
    tileRange: { xMin: -144, xMax: 206, yMin: -166, yMax: 130 },
    calculateMapCoordinate(x, y) {
      return [Number(x), Number(y)];
    }
  }
};

function createTmpMapCrs(mapType) {
  const { tileRange, tileOffset } = mapConfig[mapType];
  const crs = Object.create(L.CRS.Simple);

  crs.scale = (zoom) => Math.pow(3, zoom - TMP_MAP_ZOOM_LEVELS);
  crs.zoom = (scale) => TMP_MAP_ZOOM_LEVELS + Math.log(scale) / Math.log(3);
  crs.latLngToPoint = (latlng, zoom) => {
    const scale = crs.scale(zoom);
    const originX = (tileRange.xMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.x;
    const originY = (tileRange.yMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.y;
    return L.point((latlng.lng - originX) * scale, (-latlng.lat - originY) * scale);
  };
  crs.pointToLatLng = (point, zoom) => {
    const scale = crs.scale(zoom);
    const originX = (tileRange.xMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.x;
    const originY = (tileRange.yMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.y;
    return L.latLng(-(point.y / scale + originY), point.x / scale + originX);
  };

  return crs;
}

function getTmpMapLatLng(mapType, x, y) {
  const [mapX, mapY] = mapConfig[mapType].calculateMapCoordinate(x, y);
  return L.latLng(-mapY, mapX);
}

function getTmpMapBounds(mapType) {
  const { tileRange, tileOffset } = mapConfig[mapType];
  const minX = (tileRange.xMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.x;
  const minY = (tileRange.yMin - 0.5) * TMP_MAP_TILE_SIZE + tileOffset.y;
  const maxX = (tileRange.xMax + 0.5) * TMP_MAP_TILE_SIZE + tileOffset.x;
  const maxY = (tileRange.yMax + 0.5) * TMP_MAP_TILE_SIZE + tileOffset.y;
  return L.latLngBounds(L.latLng(-maxY, minX), L.latLng(-minY, maxX));
}

function createTmpTileLayer(mapType, map, options = {}) {
  const config = mapConfig[mapType];
  const layer = L.tileLayer('', {
    tileSize: TMP_MAP_TILE_SIZE,
    minZoom: -3,
    maxZoom: TMP_MAP_ZOOM_LEVELS,
    minNativeZoom: -3,
    maxNativeZoom: TMP_MAP_ZOOM_LEVELS,
    noWrap: true,
    bounds: getTmpMapBounds(mapType),
    reuseTiles: true,
    ...options
  });

  layer.getTileSize = () => {
    const viewZoom = map.getZoom();
    const sourceZoom = Math.max(0, Math.min(TMP_MAP_ZOOM_LEVELS, Math.round(viewZoom)));
    const levelStep = Math.pow(3, TMP_MAP_ZOOM_LEVELS - sourceZoom);
    const pixelSize = levelStep * TMP_MAP_TILE_SIZE * map.options.crs.scale(viewZoom);
    return L.point(pixelSize, pixelSize);
  };
  layer.getTileUrl = (coords) => {
    const sourceZoom = Math.max(0, Math.min(TMP_MAP_ZOOM_LEVELS, coords.z));
    const levelStep = Math.pow(3, TMP_MAP_ZOOM_LEVELS - sourceZoom);
    const maxX = Math.floor((config.tileRange.xMax - config.tileRange.xMin) / levelStep);
    const maxY = Math.floor((config.tileRange.yMax - config.tileRange.yMin) / levelStep);
    if (coords.x < 0 || coords.y < 0 || coords.x > maxX || coords.y > maxY) {
      return TMP_EMPTY_TILE;
    }
    const x = config.tileRange.xMin + coords.x * levelStep;
    const y = config.tileRange.yMin + coords.y * levelStep;
    const suffix = sourceZoom === TMP_MAP_ZOOM_LEVELS ? '' : `_${TMP_MAP_ZOOM_LEVELS + 1 - sourceZoom}`;
    return `${config.tileUrl}/${x}_${y}${suffix}.png`;
  };

  return layer;
}

function markTmpMapReadyWhenTilesLoad(tileLayer) {
  window.__tmpMapTilesReady = false;
  tileLayer.on('tileload', ({ tile }) => {
    if (window.__tmpMapTilesReady || !tile || tile.naturalWidth <= 1 || tile.naturalHeight <= 1) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__tmpMapTilesReady = true;
    }));
  });
}
