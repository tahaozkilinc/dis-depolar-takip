import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Rect,
  G,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});

const GREEN = "#3D7A3E";
const YELLOW = "#FBC02D";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 28,
    color: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  generatedAt: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: GREEN,
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#f9fafb",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: GREEN,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 6,
    marginTop: 4,
    backgroundColor: "#f3f4f6",
    padding: 4,
  },
  table: {
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: GREEN,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableTotalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: GREEN,
    backgroundColor: "#f3f4f6",
  },
  tableCell: {
    fontSize: 8,
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 4,
  },
});

function SunarLogo() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Svg viewBox="0 0 72 98" width={26} height={35}>
        <G fill={YELLOW}>
          <Rect x={0} y={0} width={20} height={20} rx={6} />
          <Rect x={26} y={0} width={20} height={20} rx={6} />
          <Rect x={52} y={0} width={20} height={20} rx={6} />
          <Rect x={0} y={26} width={20} height={20} rx={6} />
          <Rect x={26} y={26} width={20} height={20} rx={6} />
          <Rect x={52} y={26} width={20} height={20} rx={6} />
          <Rect x={0} y={52} width={20} height={20} rx={6} />
          <Rect x={26} y={52} width={20} height={20} rx={6} />
          <Rect x={52} y={52} width={20} height={20} rx={6} />
          <Rect x={0} y={78} width={20} height={20} rx={6} />
          <Rect x={26} y={78} width={20} height={20} rx={6} />
        </G>
      </Svg>
      <Text
        style={{
          fontFamily: "Times-Bold",
          fontSize: 30,
          color: GREEN,
          letterSpacing: 1,
        }}
      >
        SUNAR
      </Text>
    </View>
  );
}

export interface DailyReportWarehouseRow {
  warehouse_name: string;
  product_name: string;
  remaining_tonnage: number;
  yesterday_tonnage: number;
}

export interface DailyReportCarrierRow {
  carrier_name: string;
  shipment_count: number;
  total_tonnage: number;
}

export interface DailyReportData {
  generatedAt: string;
  yesterdayLabel: string;
  totalRemaining: number;
  totalYesterday: number;
  yesterdayShipmentCount: number;
  warehouseRows: DailyReportWarehouseRow[];
  carrierRows: DailyReportCarrierRow[];
}

function formatTon(n: number): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function DailyReportDocument({ data }: { data: DailyReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <SunarLogo />
          <Text style={styles.generatedAt}>
            Rapor Tarihi: {data.generatedAt}
          </Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            YURTİÇİ MISIR TAHSİS GÜNLÜK OPERASYON RAPORU
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Anlık Toplam Stok (Devreden)</Text>
            <Text style={styles.summaryValue}>
              {formatTon(data.totalRemaining)} ton
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>
              {data.yesterdayLabel} Yüklenen Toplam Tonaj
            </Text>
            <Text style={styles.summaryValue}>
              {formatTon(data.totalYesterday)} ton
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>
              {data.yesterdayLabel} Yapılan Sevkiyat Sayısı
            </Text>
            <Text style={styles.summaryValue}>
              {data.yesterdayShipmentCount} adet
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Depo Bazlı Stok Durumu ve {data.yesterdayLabel} Yüklemeler
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Depo</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Ürün</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.6, textAlign: "right" }]}>
              {data.yesterdayLabel} Yüklenen (ton)
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.6, textAlign: "right" }]}>
              Devreden Stok (ton)
            </Text>
          </View>
          {data.warehouseRows.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Kayıt bulunamadı.</Text>
            </View>
          )}
          {data.warehouseRows.map((r, i) => (
            <View
              key={`${r.warehouse_name}-${r.product_name}`}
              style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
            >
              <Text style={[styles.tableCell, { flex: 2.2 }]}>{r.warehouse_name}</Text>
              <Text style={[styles.tableCell, { flex: 1.6 }]}>{r.product_name}</Text>
              <Text style={[styles.tableCell, { flex: 1.6, textAlign: "right" }]}>
                {formatTon(r.yesterday_tonnage)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.6, textAlign: "right" }]}>
                {formatTon(r.remaining_tonnage)}
              </Text>
            </View>
          ))}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.tableCellBold, { flex: 3.8 }]}>TOPLAM</Text>
            <Text style={[styles.tableCellBold, { flex: 1.6, textAlign: "right" }]}>
              {formatTon(data.totalYesterday)}
            </Text>
            <Text style={[styles.tableCellBold, { flex: 1.6, textAlign: "right" }]}>
              {formatTon(data.totalRemaining)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {data.yesterdayLabel} Nakliyeci Bazlı Yüklemeler
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Nakliyeci</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>
              Araç Sayısı
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>
              Toplam Tonaj (ton)
            </Text>
          </View>
          {data.carrierRows.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {data.yesterdayLabel} herhangi bir yükleme yapılmamıştır.
              </Text>
            </View>
          )}
          {data.carrierRows.map((r, i) => (
            <View
              key={r.carrier_name}
              style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
            >
              <Text style={[styles.tableCell, { flex: 3 }]}>{r.carrier_name}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                {r.shipment_count}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>
                {formatTon(r.total_tonnage)}
              </Text>
            </View>
          ))}
          {data.carrierRows.length > 0 && (
            <View style={styles.tableTotalRow}>
              <Text style={[styles.tableCellBold, { flex: 3 }]}>TOPLAM</Text>
              <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: "right" }]}>
                {data.yesterdayShipmentCount}
              </Text>
              <Text style={[styles.tableCellBold, { flex: 1.5, textAlign: "right" }]}>
                {formatTon(data.totalYesterday)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          Bu rapor {data.generatedAt} tarihinde sistem tarafından otomatik olarak oluşturulmuştur.
        </Text>
      </Page>
    </Document>
  );
}
