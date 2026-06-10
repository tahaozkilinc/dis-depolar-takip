"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-lg border bg-white text-sm text-gray-500 shadow-sm">
      Harita yükleniyor...
    </div>
  ),
});

export default MapView;
