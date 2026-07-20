import { useEffect, useRef, useState } from "react";
import { dbService, WasteBankLocation } from "../../services/db";
import { MapPin, Phone, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export function WasteBankMapPage() {
  const [locations, setLocations] = useState<WasteBankLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<WasteBankLocation | null>(null);
  const mapRef = useRef<any>(null);
  const leafletMapInstance = useRef<any>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await dbService.getLocations();
        setLocations(data);
        if (data.length > 0) {
          setActiveLocation(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading || locations.length === 0) return;

    // Check if L is loaded from script CDN
    const L = (window as any).L;
    if (!L) {
      console.warn("Leaflet library not loaded yet.");
      return;
    }

    // If map already exists, clean it up first
    if (leafletMapInstance.current) {
      leafletMapInstance.current.remove();
    }

    // Default center to Magetan/Surabaya (based on first location)
    const firstLoc = locations[0];
    const map = L.map("map-view").setView([firstLoc.lat, firstLoc.lng], 13);
    leafletMapInstance.current = map;

    // Add Tile Layer (OpenStreetMap tiles)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom Icon for DLH Waste Bank marker
    const dlhIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Populate markers
    locations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], { icon: dlhIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px;">
            <b style="color: #16a34a; font-size: 12px;">${loc.name}</b><br/>
            ${loc.address}<br/>
            <strong>Jam:</strong> ${loc.hours}
          </div>
        `);

      marker.on("click", () => {
        setActiveLocation(loc);
      });
    });

    return () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.remove();
        leafletMapInstance.current = null;
      }
    };
  }, [loading, locations]);

  const handlePanTo = (loc: WasteBankLocation) => {
    setActiveLocation(loc);
    const L = (window as any).L;
    if (leafletMapInstance.current && L) {
      leafletMapInstance.current.setView([loc.lat, loc.lng], 15);
      // Auto open popup
      // To keep it simple, we pan and zoom in.
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Peta Unit Bank Sampah DLH</h1>
        <p className="text-sm text-slate-500 font-medium">Temukan lokasi unit bank sampah Dinas Lingkungan Hidup terdekat untuk menyetorkan barang.</p>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center rounded-3xl bg-white border">
          <Loader2 className="h-8 w-8 animate-spin text-dlh-green-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Map Viewer */}
          <div className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm md:col-span-2 h-[450px] relative z-10">
            <div id="map-view" className="w-full h-full rounded-2xl overflow-hidden" />
          </div>

          {/* Location Sidebar List */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Cabang & Detail</h3>
            
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isActive = activeLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => handlePanTo(loc)}
                    className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                      isActive 
                        ? "bg-dlh-green-50 border-dlh-green-300 shadow-xs" 
                        : "bg-white border-slate-100 hover:bg-slate-50/50"
                    }`}
                  >
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MapPin className={`h-4 w-4 shrink-0 ${isActive ? "text-dlh-green-600" : "text-slate-400"}`} />
                      {loc.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">{loc.address}</p>
                    
                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-dlh-green-200/50 space-y-1.5 text-[10px] text-slate-600 font-semibold">
                        <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {loc.hours}</div>
                        <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {loc.phone}</div>
                        <Link
                          to="/user/submit-item"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-dlh-green-600 hover:bg-dlh-green-700 text-white px-3.5 py-2 text-[10px] font-bold shadow-sm transition-all"
                        >
                          Booking di Unit Ini <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
