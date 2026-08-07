import { createIcon } from '../createIcon';

/**
 * Navigation, chevrons and arrows.
 *
 * Chevrons are drawn at a 45° opening from a 4px arm so all four rotations
 * are optically identical — building them as one shape rotated four times
 * is what stops the set looking hand-made at small sizes.
 */

export const ChevronRight = createIcon('ChevronRight', <path d="M9.5 5.5 16 12l-6.5 6.5" />);
export const ChevronLeft = createIcon('ChevronLeft', <path d="M14.5 5.5 8 12l6.5 6.5" />);
export const ChevronUp = createIcon('ChevronUp', <path d="M5.5 14.5 12 8l6.5 6.5" />);
export const ChevronDown = createIcon('ChevronDown', <path d="M5.5 9.5 12 16l6.5-6.5" />);

export const ArrowRight = createIcon(
  'ArrowRight',
  <>
    <path d="M4 12h16" />
    <path d="M13.5 5.5 20 12l-6.5 6.5" />
  </>,
);
export const ArrowLeft = createIcon(
  'ArrowLeft',
  <>
    <path d="M20 12H4" />
    <path d="M10.5 5.5 4 12l6.5 6.5" />
  </>,
);
export const ArrowUp = createIcon(
  'ArrowUp',
  <>
    <path d="M12 20V4" />
    <path d="M5.5 10.5 12 4l6.5 6.5" />
  </>,
);
export const ArrowUpRight = createIcon(
  'ArrowUpRight',
  <>
    <path d="M6.5 17.5 17.5 6.5" />
    <path d="M8.5 6.5h9v9" />
  </>,
);
export const ArrowLeftRight = createIcon(
  'ArrowLeftRight',
  <>
    <path d="M3.5 8.5h17" />
    <path d="M17 5 20.5 8.5 17 12" />
    <path d="M20.5 15.5h-17" />
    <path d="M7 12 3.5 15.5 7 19" />
  </>,
);

export const Home = createIcon(
  'Home',
  <>
    <path d="M3.5 10.5 12 3.5l8.5 7" />
    <path d="M5.5 9.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
    <path d="M9.5 20v-6h5v6" />
  </>,
);

export const Menu = createIcon(
  'Menu',
  <>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </>,
);

export const X = createIcon(
  'X',
  <>
    <path d="M6 6 18 18" />
    <path d="M18 6 6 18" />
  </>,
);

export const ExternalLink = createIcon(
  'ExternalLink',
  <>
    <path d="M13.5 4.5h6v6" />
    <path d="M19.5 4.5 11 13" />
    <path d="M18 14.5v4a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
  </>,
);

export const Search = createIcon(
  'Search',
  <>
    <circle cx={11} cy={11} r={6.5} />
    <path d="M15.8 15.8 20.5 20.5" />
  </>,
);

export const Maximize2 = createIcon(
  'Maximize2',
  <>
    <path d="M14 4.5h5.5V10" />
    <path d="M10 19.5H4.5V14" />
    <path d="M19.5 4.5 14 10" />
    <path d="M4.5 19.5 10 14" />
  </>,
);

export const ZoomIn = createIcon(
  'ZoomIn',
  <>
    <circle cx={11} cy={11} r={6.5} />
    <path d="M15.8 15.8 20.5 20.5" />
    <path d="M8.5 11h5" />
    <path d="M11 8.5v5" />
  </>,
);

export const ZoomOut = createIcon(
  'ZoomOut',
  <>
    <circle cx={11} cy={11} r={6.5} />
    <path d="M15.8 15.8 20.5 20.5" />
    <path d="M8.5 11h5" />
  </>,
);
