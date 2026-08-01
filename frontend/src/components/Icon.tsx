import { cx } from "../utils";

const paths: Record<
  string,
  { viewBox?: string; d: string; fillRule?: "evenodd"; clipRule?: "evenodd" }
> = {
  bolt: { d: "M13 2L3 14h7l-1 8 10-12h-7l1-8z" },
  search: {
    d: "M10 2a8 8 0 105.293 14.293l4.207 4.207 1.414-1.414-4.207-4.207A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"
  },
  sync: {
    d: "M6.343 6.343A7 7 0 0118 8h2A9 9 0 105.05 5.05L2.5 2.5V9h6.5L6.343 6.343zM17.657 17.657A7 7 0 016 16H4a9 9 0 0014.95 2.95L21.5 21.5V15H15l2.657 2.657z"
  },
  refresh: {
    d: "M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107.75-6.97 7.7 7.7 0 014.9 2.32z"
  },
  notifications_active: {
    d: "M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 10-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z"
  },
  wifi_tethering: {
    d: "M12 11a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3zm0-6a9 9 0 019 9h-2a7 7 0 00-14 0H3a9 9 0 019-9zm0-4C6.477 1 2 5.477 2 11h2a8 8 0 0116 0h2c0-5.523-4.477-10-10-10z"
  },
  feed: { d: "M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h16v2H4v-2z" },
  schedule: {
    d: "M12 8a1 1 0 011 1v3.586l2.707 2.707-1.414 1.414L11 13.414V9a1 1 0 011-1zm0-6a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z"
  },
  filter_list: { d: "M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" },
  view_list: { d: "M4 6h3v3H4V6zm0 5h3v3H4v-3zm0 5h3v3H4v-3zm5-10h11v3H9V6zm0 5h11v3H9v-3zm0 5h11v3H9v-3z" },
  grid_view: { d: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" },
  travel_explore: {
    d: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm3.5-5.5l5 5-1.5 1.5-5-5v-.8l-.3-.3A5 5 0 1115.5 14a5 5 0 01-1.1 3.2l.3.3h.8z"
  },
  chevron_left: { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" },
  chevron_right: { d: "M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z" },
  info: {
    d: "M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
  },
  menu_open: { d: "M3 18h13v-2H3v2zm0-5h18v-2H3v2zm0-7v2h13V6H3zm17 7l-4-4v8l4-4z" },
  keyboard_return: { d: "M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z" },
  tune: {
    d: "M3 17v2h6v-2H3zm0-6v2h10v-2H3zm0-6v2h14V5H3zm16 12v2h2v-2h-2zm-4-6v2h6v-2h-6zm-4-6v2h10V5H11z"
  },
  close: { d: "M18.3 5.71L12 12l6.3 6.29-1.41 1.42L12 13.41l-6.89 6.3-1.42-1.41L10.59 12 3.69 5.71 5.1 4.29 12 10.59l6.89-6.3 1.41 1.42z" },
  radar: {
    d: "M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8zm-1-8.414V6h2v4.586l3.293 3.293-1.414 1.414L11 11.586z"
  },
  keyboard_tab_rtl: { d: "M11 19l-1.41-1.41L14.17 13H2v-2h12.17l-4.58-4.59L11 5l7 7-7 7zM20 5h2v14h-2V5z" },
  bookmark: { d: "M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2zm0 15.97l-5-2.14-5 2.14V5h10v13.97z" },
  delete: { d: "M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zm3.5-9h1v8h-1V10zm4 0h1v8h-1V10zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" },
  edit: {
    d: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
  },
  factory: {
    d: "M22 19V7l-4 2V7l-4 2V7L2 13v6h20zM6 18H4v-2h2v2zm4 0H8v-2h2v2zm4 0h-2v-2h2v2z"
  },
  straighten: { d: "M22 6H2v12h20V6zm-2 10H4V8h16v8z" },
  verified: { d: "M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4l3-3zm-1 14l7-7-1.41-1.41L11 13.17 7.41 9.59 6 11l5 5z" },
  check: { d: "M9 16.17l-3.88-3.88L3.71 13.7 9 19l12-12-1.41-1.41z" },
  add: { d: "M19 11H13V5h-2v6H5v2h6v6h2v-6h6v-2z" },
  palette: {
    d: "M12 2a10 10 0 100 20c1.1 0 2-.9 2-2 0-.55-.22-1.05-.59-1.41-.37-.37-.59-.87-.59-1.42 0-1.1.9-2 2-2h2a5 5 0 005-5c0-4.42-4.48-8-10-8zm-4.5 10A1.5 1.5 0 116 10.5 1.5 1.5 0 017.5 12zm3-4A1.5 1.5 0 119 6.5 1.5 1.5 0 0110.5 8zm3 4A1.5 1.5 0 1112 10.5 1.5 1.5 0 0113.5 12zm3-4A1.5 1.5 0 1115 6.5 1.5 1.5 0 0116.5 8z"
  },
  layers: { d: "M12 2L1 9l11 7 9-5.73V17h2V9L12 2zm0 11.2L4.47 9 12 4.8 19.53 9 12 13.2zM1 13l11 7 11-7-2.03-1.29L12 17.2 3.03 11.71 1 13z" },
  open_in_new: { d: "M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H7v10h10v-4h2v6H5V5z" },
  preview: { d: "M12 6c-5 0-9 6-9 6s4 6 9 6 9-6 9-6-4-6-9-6zm0 10a4 4 0 110-8 4 4 0 010 8z" },
  description: { d: "M6 2h9l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" },
  insights: { d: "M3 13h2v8H3v-8zm4-6h2v14H7V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3zm4 10h2v8h-2v-8z" },
  visibility: { d: "M12 6c-5 0-9 6-9 6s4 6 9 6 9-6 9-6-4-6-9-6zm0 10a4 4 0 110-8 4 4 0 010 8z" },
  visibility_off: { d: "M2.81 2.81L1.39 4.22l3.01 3.01C2.52 8.79 1 11 1 11s4 6 11 6c2.08 0 3.93-.52 5.55-1.35l3.23 3.23 1.41-1.41L2.81 2.81zM12 8a4 4 0 013.98 3.58l-5.56-5.56A4 4 0 0112 8zm0 8c-4.4 0-7.64-3.36-8.81-5 1-1.4 2.71-3.14 5.02-4.13l1.59 1.59A4 4 0 0012 16zm8.81-5c-.53.76-1.3 1.67-2.3 2.49l-1.43-1.43A4 4 0 0012 8a4 4 0 00-.68.06L9.5 6.24A11.9 11.9 0 0112 6c7 0 11 5 11 5s-.7 1.06-2.19 2.33L20.81 11z" }
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className,
  title
}: {
  name: IconName;
  className?: string;
  title?: string;
}) {
  const icon = paths[name];
  if (!icon) return null;
  return (
    <svg
      className={cx("inline-block shrink-0 align-middle", className)}
      viewBox={icon.viewBox ?? "0 0 24 24"}
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <path d={icon.d} fillRule={icon.fillRule} clipRule={icon.clipRule} />
    </svg>
  );
}
