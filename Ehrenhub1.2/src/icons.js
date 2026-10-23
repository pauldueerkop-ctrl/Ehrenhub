(function(root) {
  'use strict';
  const paths = {
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    arrowUp:'<path d="M6 18 18 6M6 6h12v12"/>',
    back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    book:'<path d="M12 6v15m0-15C8 3 4 3 2 4v15c3-1 7 0 10 2 3-2 7-3 10-2V4c-2-1-6-1-10 2Z"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
    coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 1.7 2.7 3 6 3 1.1 0 2.1-.1 3-.4M3 11v5c0 1.7 2.7 3 6 3 1.1 0 2.1-.1 3-.4"/><path d="M15 8.5c3.3 0 6 1.3 6 3s-2.7 3-6 3-6-1.3-6-3c0-.5.2-.9.6-1.3M9 14.5V18c0 1.7 2.7 3 6 3s6-1.3 6-3v-6.5"/>',
    graduation:'<path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7c3 3 9 3 12 0v-7M22 8v7"/>',
    shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    star:'<path d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5 1.2-7-5-5 7-1Z"/>',
    spark:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2ZM20 2v4m-2-2h4"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 5a6 6 0 0 1 3 5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    filter:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="16" cy="17" r="2" fill="currentColor"/>',
    laptop:'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-2 5h20l-2-5"/>',
    tent:'<path d="m3 21 9-19 9 19H3Zm5 0 4-9 4 9M9 2l3 6 3-6"/>',
    flag:'<path d="M4 22V3c6-4 10 4 16 0v11c-6 4-10-4-16 0"/>',
    layers:'<path d="m12 2 10 5-10 5L2 7l10-5ZM2 12l10 5 10-5M2 17l10 5 10-5"/>',
    leaf:'<path d="M20 3C8 1 2 8 5 15s16 6 15-12ZM4 21l11-12"/>',
    mug:'<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Zm14 1h2a3 3 0 0 1 0 6h-2M6 2v3m4-3v3m4-3v3"/>',
    phone:'<path d="M5 2h4l2 5-3 2a14 14 0 0 0 7 7l2-3 5 2v4c0 2-2 3-4 3A20 20 0 0 1 2 6c0-2 1-4 3-4Z"/>',
    external:'<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    file:'<path d="M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 13h8m-8 4h6"/>',
    print:'<path d="M6 9V2h12v7M6 18H3V9h18v9h-3M6 14h12v8H6Zm11-2h.01"/>',
    link:'<path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3m-3 3-3 3a5 5 0 0 1-7-7l3-3m1 6 8-8"/>',
    refresh:'<path d="M21 4v6h-6M3 20v-6h6M5 7a8 8 0 0 1 13-2l3 5M3 14l3 5a8 8 0 0 0 13-2"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    message:'<path d="M21 11a9 9 0 0 1-9 9c-2 0-4-.6-5-1.5L2 21l1.5-5C2.6 15 2 13 2 11a9.5 9.5 0 0 1 19 0Z"/><path d="M7 10h10m-10 4h6"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4m0-15.6-1.4 1.4M5.6 18.4l-1.4 1.4"/>',
    paw:'<ellipse cx="7" cy="7" rx="2.3" ry="3"/><ellipse cx="16" cy="7" rx="2.3" ry="3"/><ellipse cx="3.3" cy="12" rx="1.8" ry="2.5"/><ellipse cx="20" cy="12" rx="1.8" ry="2.5"/><path d="M6 21c-3-2 1-9 5.5-9S20 19 17 21c-2 1-4-1-5.5-1S8 22 6 21Z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M9 10v7m6-7v7"/>'
  };
  function icon(name,cls='') {return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;}
  function brandMark(){return '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 18C4 18 2 4 11 4c6 0 9 8 9 14Zm2 2C22 4 36 2 36 11c0 6-8 9-14 9Zm-2 2c16 0 18 14 9 14-6 0-9-8-9-14Zm-2-2C18 36 4 38 4 29c0-6 8-9 14-9Z" fill="currentColor"/></svg>';}
  function dog(){return `<svg class="hubi-dog" viewBox="0 0 140 132" fill="none" aria-hidden="true"><ellipse cx="70" cy="121" rx="46" ry="7" fill="#143f3020"/><path class="dog-tail" d="M103 92c23 0 27-29 17-34-7-3-2 14-19 16" fill="#c9935a" stroke="#3d332b" stroke-width="2.5"/><path d="M37 87c4-16 24-20 43-16 19 3 26 18 25 41H36L37 87Z" fill="#dfb480" stroke="#3d332b" stroke-width="2.5"/><path d="M63 83c17-4 25 7 25 29H56c-2-11 0-22 7-29Z" fill="#f8e5c7"/><path d="M38 103v17h18v-19m28 1v18h19v-17" fill="#dfb480" stroke="#3d332b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 41c2-23 42-23 49 2 4 10 5 31-8 40-13 8-32 4-41-5-9-10-6-28 0-37Z" fill="#dfb480" stroke="#3d332b" stroke-width="2.5"/><path d="M45 36C24 29 24 58 32 68c9 10 17-8 18-16l-5-16Zm47-2c21-5 24 25 15 35-10 10-17-7-18-16l3-19Z" fill="#825334" stroke="#3d332b" stroke-width="2.5"/><path d="M59 60c-11 2-10 16-3 20 7 5 19 5 25-1 6-7 1-17-6-18l-16-1Z" fill="#fff1dc"/><g class="dog-eyes"><ellipse cx="57" cy="52" rx="3" ry="4" fill="#302e29"/><ellipse cx="80" cy="52" rx="3" ry="4" fill="#302e29"/><circle cx="58" cy="51" r="1" fill="white"/><circle cx="81" cy="51" r="1" fill="white"/></g><g class="dog-happy-eyes" stroke="#302e29" stroke-width="2.5" stroke-linecap="round"><path d="m53 53 4-3 4 3m15 0 4-3 4 3"/></g><path d="M62 64c0-5 14-5 14 0 0 4-7 7-7 7s-7-3-7-7Z" fill="#302e29"/><path d="M69 70v5m-7-1c2 5 12 5 14-1" stroke="#302e29" stroke-width="2" stroke-linecap="round"/><path class="dog-tongue" d="M67 77h8v6c0 6-8 6-8 0v-6Z" fill="#e98e8d"/><path d="m48 80 20 8 23-6-2 10-20 8-22-12 1-8Z" fill="#194e3b"/><circle cx="69" cy="94" r="4" fill="#efca77"/><path d="M42 117v3m8-3v3m40-3v3m8-3v3" stroke="#825334" stroke-width="1.5"/></svg>`;}
  (root.EH=root.EH||{}).Icons={icon,brandMark,dog};
})(globalThis);
