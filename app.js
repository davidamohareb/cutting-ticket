const {
  useState,
  useEffect,
  useRef
} = React;

// ---------- Constants ----------
const CM2_PER_FT2 = 929.0304;
const STORAGE_KEY = "leather-pricing-data-v1";
const T = {
  bg: "#E7DAC2",
  panel: "#F4ECDC",
  ink: "#2C1F12",
  inkSoft: "#5C4A35",
  line: "#B49B76",
  accent: "#6E2A26",
  // oxblood
  brass: "#8C6A2F",
  danger: "#8C2F2F"
};
const fontDisplay = "'Bitter','Rockwell','Georgia',serif";
const fontBody = "'Segoe UI','Helvetica Neue',Arial,sans-serif";

// ---------- Helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const num = v => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const egp = v => `${(Math.round(v * 100) / 100).toLocaleString("en-EG", {
  maximumFractionDigits: 2
})} EGP`;
const ft = v => `${(Math.round(v * 1000) / 1000).toLocaleString()} ft²`;
function computeItem(item, leathers, accessories) {
  const wasteMult = 1 + num(item.wastePct) / 100;
  let rawFt = 0,
    wasteFt = 0,
    leatherCost = 0;
  const pieceRows = (item.pieces || []).map(p => {
    const leather = leathers.find(l => l.id === p.leatherId);
    const areaFt = num(p.lengthCm) * num(p.widthCm) * (num(p.qty) || 1) / CM2_PER_FT2;
    const areaWithWaste = areaFt * wasteMult;
    const cost = areaWithWaste * (leather ? num(leather.pricePerFt) : 0);
    rawFt += areaFt;
    wasteFt += areaWithWaste;
    leatherCost += cost;
    return {
      ...p,
      leatherName: leather ? leather.name : "—",
      areaFt,
      areaWithWaste,
      cost
    };
  });
  let accCost = 0;
  const accRows = (item.accessories || []).map(a => {
    const acc = accessories.find(x => x.id === a.accessoryId);
    const cost = (acc ? num(acc.unitPrice) : 0) * (num(a.qty) || 1);
    accCost += cost;
    return {
      ...a,
      name: acc ? acc.name : "—",
      unitPrice: acc ? num(acc.unitPrice) : 0,
      cost
    };
  });
  const subtotal = leatherCost + accCost;
  let overheadTotal = 0;
  const overheadRows = (item.overheads || []).map(o => {
    const cost = o.mode === "amount" ? num(o.value) : subtotal * (num(o.value) / 100);
    overheadTotal += cost;
    return {
      ...o,
      cost
    };
  });
  const totalCost = subtotal + overheadTotal;
  let revenue = 0;
  if (item.revenueMode === "percent") {
    revenue = totalCost * (num(item.revenueValue) / 100);
  } else if (item.revenueMode === "hourly") {
    revenue = num(item.revenueValue) * num(item.hoursNeeded);
  } else {
    revenue = num(item.revenueValue);
  }
  const sellingPrice = totalCost + revenue;
  const markupPct = totalCost > 0 ? revenue / totalCost * 100 : 0;
  const marginPct = sellingPrice > 0 ? revenue / sellingPrice * 100 : 0;
  return {
    pieceRows,
    accRows,
    rawFt,
    wasteFt,
    leatherCost,
    accCost,
    subtotal,
    overheadRows,
    overheadTotal,
    totalCost,
    revenue,
    sellingPrice,
    markupPct,
    marginPct
  };
}

// ft² needed per leather type (waste included) for one unit of an item
function leatherNeedsFt(item) {
  const wasteMult = 1 + num(item.wastePct) / 100;
  const needs = {};
  (item.pieces || []).forEach(p => {
    if (!p.leatherId) return;
    const areaFt = num(p.lengthCm) * num(p.widthCm) * (num(p.qty) || 1) / CM2_PER_FT2 * wasteMult;
    needs[p.leatherId] = (needs[p.leatherId] || 0) + areaFt;
  });
  return needs;
}

// Per-piece needs (waste included): [{pieceId, leatherId, name, ft}]
function pieceNeedsList(item) {
  const wasteMult = 1 + num(item.wastePct) / 100;
  return (item.pieces || []).filter(p => p.leatherId).map(p => ({
    pieceId: p.id,
    leatherId: p.leatherId,
    name: p.name,
    ft: num(p.lengthCm) * num(p.widthCm) * (num(p.qty) || 1) / CM2_PER_FT2 * wasteMult
  }));
}

// ---------- Small UI atoms ----------
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: `1.5px solid ${T.line}`,
  borderRadius: 6,
  background: "#FFFDF7",
  color: T.ink,
  fontFamily: fontBody,
  fontSize: 14,
  boxSizing: "border-box"
};
function Field({
  label,
  children,
  flex
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      flex: flex || "1 1 120px",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: T.inkSoft,
      marginBottom: 4,
      fontFamily: fontBody
    }
  }, label), children);
}
function Btn({
  children,
  onClick,
  kind = "solid",
  small,
  style
}) {
  const base = {
    fontFamily: fontBody,
    fontWeight: 600,
    fontSize: small ? 13 : 14,
    padding: small ? "6px 12px" : "10px 18px",
    borderRadius: 6,
    cursor: "pointer",
    border: `1.5px solid ${T.ink}`,
    background: kind === "solid" ? T.accent : "transparent",
    color: kind === "solid" ? "#F7EFE0" : T.ink,
    ...(kind === "solid" ? {
      borderColor: T.accent
    } : {}),
    ...(kind === "danger" ? {
      background: "transparent",
      color: T.danger,
      borderColor: T.danger
    } : {}),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: base
  }, children);
}
function ConfirmBtn({
  children,
  onConfirm,
  small,
  kind = "danger",
  style,
  confirmLabel
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return /*#__PURE__*/React.createElement(Btn, {
    small: small,
    kind: kind,
    style: armed ? {
      ...style,
      background: T.danger,
      color: "#F7EFE0",
      borderColor: T.danger
    } : style,
    onClick: () => {
      if (armed) {
        setArmed(false);
        onConfirm();
      } else {
        setArmed(true);
      }
    }
  }, armed ? confirmLabel || "Tap again to confirm" : children);
}
function Card({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.panel,
      border: `2px dashed ${T.line}`,
      borderRadius: 10,
      padding: 16,
      ...style
    }
  }, children);
}
function SectionTitle({
  children
}) {
  return /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 16,
      margin: "0 0 10px",
      color: T.ink,
      letterSpacing: 0.3
    }
  }, children);
}

// ---------- Photo helper ----------
function resizeImage(file, maxDim = 480) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Main App ----------
function App() {
  const [data, setData] = useState({
    leathers: [],
    accessories: [],
    items: [],
    orders: [],
    budgetTx: [],
    settings: {
      defaultOverheads: [{
        id: uid(),
        name: "Tool depreciation",
        mode: "percent",
        value: 5
      }, {
        id: uid(),
        name: "Other materials",
        mode: "percent",
        value: 5
      }]
    }
  });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("items");
  const [editingId, setEditingId] = useState(null);
  const [saveNote, setSaveNote] = useState("");
  const saveTimer = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          // Migrate old items (fixed depreciation/other %) to dynamic overheads
          parsed.items = (parsed.items || []).map(it => {
            if (it.overheads) return it;
            const overheads = [];
            if (it.depreciationPct !== undefined) overheads.push({
              id: uid(),
              name: "Tool depreciation",
              mode: "percent",
              value: num(it.depreciationPct)
            });
            if (it.otherPct !== undefined) overheads.push({
              id: uid(),
              name: "Other materials",
              mode: "percent",
              value: num(it.otherPct)
            });
            return {
              ...it,
              overheads
            };
          });
          // Settings with default overheads for new items
          if (!parsed.settings) {
            parsed.settings = {
              defaultOverheads: [{
                id: uid(),
                name: "Tool depreciation",
                mode: "percent",
                value: 5
              }, {
                id: uid(),
                name: "Other materials",
                mode: "percent",
                value: 5
              }]
            };
          }
          // Snapshot current cost as "priced at" for items that don't have one yet
          parsed.items = parsed.items.map(it => it.pricedCost !== undefined ? it : {
            ...it,
            pricedCost: computeItem(it, parsed.leathers || [], parsed.accessories || []).totalCost
          });
          parsed.items = parsed.items.map(it => it.description === undefined ? {
            ...it,
            description: ""
          } : it);
          parsed.orders = parsed.orders || [];
          parsed.orders = parsed.orders.map(o => o.colorChoices ? o : {
            ...o,
            colorChoices: {}
          });
          parsed.budgetTx = parsed.budgetTx || [];
          parsed.leathers = (parsed.leathers || []).map(l => l.colors && l.colors.length ? l : {
            ...l,
            colors: [{
              id: uid(),
              name: "Default",
              stockFt: 0
            }]
          });
          parsed.accessories = (parsed.accessories || []).map(a => a.stockQty === undefined ? {
            ...a,
            stockQty: 0
          } : a);
          setData(parsed);
        }
      } catch (e) {
        /* first run – nothing saved yet */
      }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(data));
        setSaveNote("Saved");
        setTimeout(() => setSaveNote(""), 1500);
      } catch (e) {
        setSaveNote("Save failed — photo may be too large");
      }
    }, 600);
  }, [data, loaded]);
  const update = patch => setData(d => ({
    ...d,
    ...patch
  }));
  const editingItem = data.items.find(i => i.id === editingId);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: T.bg,
      color: T.ink,
      fontFamily: fontBody,
      padding: "0 0 60px"
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@600;800&display=swap');
        input:focus, select:focus { outline: 2px solid ${T.brass}; }
        button:focus-visible { outline: 2px solid ${T.brass}; }
      `), /*#__PURE__*/React.createElement("header", {
    style: {
      background: T.ink,
      color: "#EFE3CC",
      padding: "20px 20px 16px",
      borderBottom: `4px solid ${T.brass}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 860,
      margin: "0 auto",
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 24,
      margin: 0,
      letterSpacing: 0.5
    }
  }, "The Cutting Ticket"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#C9B58E"
    }
  }, "leather goods costing & pricing"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "#C9B58E"
    }
  }, saveNote)), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 860,
      margin: "14px auto 0",
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, [["items", "Items"], ["orders", "Orders"], ["budgets", "Budgets"], ["leathers", "Leathers"], ["accessories", "Accessories"], ["settings", "Settings"]].map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => {
      setTab(k);
      setEditingId(null);
    },
    style: {
      fontFamily: fontDisplay,
      fontSize: 14,
      padding: "8px 16px",
      borderRadius: "8px 8px 0 0",
      border: "none",
      cursor: "pointer",
      background: tab === k ? T.bg : "transparent",
      color: tab === k ? T.ink : "#C9B58E",
      fontWeight: 700
    }
  }, label)))), /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 860,
      margin: "24px auto 0",
      padding: "0 16px"
    }
  }, !loaded && /*#__PURE__*/React.createElement("p", null, "Loading your workshop…"), loaded && tab === "leathers" && /*#__PURE__*/React.createElement(LeatherTab, {
    data: data,
    update: update
  }), loaded && tab === "accessories" && /*#__PURE__*/React.createElement(AccessoryTab, {
    data: data,
    update: update
  }), loaded && tab === "settings" && /*#__PURE__*/React.createElement(SettingsTab, {
    data: data,
    update: update,
    setData: setData
  }), loaded && tab === "orders" && /*#__PURE__*/React.createElement(OrdersTab, {
    data: data,
    update: update
  }), loaded && tab === "budgets" && /*#__PURE__*/React.createElement(BudgetsTab, {
    data: data,
    update: update
  }), loaded && tab === "items" && !editingItem && /*#__PURE__*/React.createElement(ItemList, {
    data: data,
    update: update,
    onEdit: setEditingId
  }), loaded && tab === "items" && editingItem && /*#__PURE__*/React.createElement(ItemEditor, {
    item: editingItem,
    data: data,
    update: update,
    onBack: () => setEditingId(null)
  })));
}

// ---------- Leathers ----------
function LeatherTab({
  data,
  update
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const add = () => {
    if (!name.trim() || num(price) <= 0) return;
    update({
      leathers: [...data.leathers, {
        id: uid(),
        name: name.trim(),
        pricePerFt: num(price),
        colors: [{
          id: uid(),
          name: "Default",
          stockFt: 0
        }]
      }]
    });
    setName("");
    setPrice("");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(RestockCard, {
    unit: "ft²",
    lines: data.leathers.flatMap(l => (l.colors || []).filter(c => isLow(c.stockFt, c.minFt)).map(c => ({
      name: `${l.name} — ${c.name}`,
      stock: num(c.stockFt),
      min: num(c.minFt),
      max: num(c.maxFt) > num(c.minFt) ? num(c.maxFt) : 0,
      buy: restockAmount(c.stockFt, c.minFt, c.maxFt),
      price: num(l.pricePerFt)
    })))
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Add a leather"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Leather name",
    flex: "2 1 200px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "e.g. Crazy horse 1.6mm, dark brown"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Price per ft² (EGP)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: price,
    onChange: e => setPrice(e.target.value),
    placeholder: "e.g. 180"
  })), /*#__PURE__*/React.createElement(Btn, {
    onClick: add,
    style: {
      flex: "0 0 auto"
    }
  }, "Add leather"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Leather library"), data.leathers.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: T.inkSoft,
      fontSize: 14
    }
  }, "No leathers yet. Add the hides you buy, priced per square foot, and you'll pick them when building an item."), data.leathers.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.id,
    style: {
      borderBottom: `1px solid ${T.line}`,
      paddingBottom: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(EditableRow, {
    fields: [{
      key: "name",
      value: l.name,
      flex: 2
    }, {
      key: "pricePerFt",
      value: l.pricePerFt,
      type: "number",
      suffix: "EGP/ft²"
    }],
    onSave: vals => update({
      leathers: data.leathers.map(x => x.id === l.id ? {
        ...x,
        name: vals.name,
        pricePerFt: num(vals.pricePerFt)
      } : x)
    }),
    onDelete: () => update({
      leathers: data.leathers.filter(x => x.id !== l.id)
    })
  }), /*#__PURE__*/React.createElement(ColorStock, {
    leather: l,
    onChange: colors => update({
      leathers: data.leathers.map(x => x.id === l.id ? {
        ...x,
        colors
      } : x)
    })
  })))));
}

// Low-stock check: min must be set (>0) and stock at or below it
function isLow(stock, min) {
  return num(min) > 0 && num(stock) <= num(min);
}
// How much to buy: up to max if set above min, otherwise up to min
function restockAmount(stock, min, max) {
  const target = num(max) > num(min) ? num(max) : num(min);
  return Math.max(0, Math.round((target - num(stock)) * 100) / 100);
}
function LowBadge() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#fff",
      background: T.danger,
      borderRadius: 6,
      padding: "3px 7px",
      whiteSpace: "nowrap"
    }
  }, "⚠ Low");
}
function RestockCard({
  lines,
  unit
}) {
  if (lines.length === 0) return null;
  const total = lines.reduce((s, ln) => s + ln.buy * ln.price, 0);
  return /*#__PURE__*/React.createElement(Card, {
    style: {
      borderColor: T.danger
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, null, "⚠ Restock needed"), lines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "5px 0",
      borderBottom: `1px dashed ${T.line}`,
      fontSize: 13,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, ln.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.danger
    }
  }, ln.stock, " ", unit, " left (min ", ln.min, ") → buy ", ln.buy, " ", unit, ln.max ? ` to reach ${ln.max}` : "", " (~", egp(ln.buy * ln.price), ")"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 13
    }
  }, "Total to restock: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.accent
    }
  }, "~", egp(total))));
}
function ColorStock({
  leather,
  onChange
}) {
  const colors = leather.colors || [];
  const [cName, setCName] = useState("");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 4,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: T.inkSoft,
      marginBottom: 4
    }
  }, "Colors & stock"), colors.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      padding: "4px 0",
      fontSize: 13,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Color name",
    flex: "2 1 120px"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: "6px 8px"
    },
    value: c.name,
    onChange: e => onChange(colors.map(x => x.id === c.id ? {
      ...x,
      name: e.target.value
    } : x))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Stock (ft²)",
    flex: "0 1 80px"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: "6px 8px",
      color: num(c.stockFt) < 0 ? T.danger : T.ink
    },
    type: "number",
    step: "0.1",
    value: c.stockFt,
    onChange: e => onChange(colors.map(x => x.id === c.id ? {
      ...x,
      stockFt: e.target.value
    } : x))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Min",
    flex: "0 1 65px"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: "6px 8px"
    },
    type: "number",
    step: "0.5",
    min: "0",
    value: c.minFt || "",
    onChange: e => onChange(colors.map(x => x.id === c.id ? {
      ...x,
      minFt: e.target.value
    } : x))
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Max",
    flex: "0 1 65px"
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontSize: 13,
      padding: "6px 8px"
    },
    type: "number",
    step: "0.5",
    min: "0",
    value: c.maxFt || "",
    onChange: e => onChange(colors.map(x => x.id === c.id ? {
      ...x,
      maxFt: e.target.value
    } : x))
  })), isLow(c.stockFt, c.minFt) && /*#__PURE__*/React.createElement(LowBadge, null), /*#__PURE__*/React.createElement(ConfirmBtn, {
    small: true,
    onConfirm: () => onChange(colors.filter(x => x.id !== c.id))
  }, "✕"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      flex: "0 1 160px",
      fontSize: 13,
      padding: "6px 8px"
    },
    value: cName,
    onChange: e => setCName(e.target.value),
    placeholder: "New color name"
  }), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "outline",
    onClick: () => {
      if (!cName.trim()) return;
      onChange([...colors, {
        id: uid(),
        name: cName.trim(),
        stockFt: 0
      }]);
      setCName("");
    }
  }, "+ Color")));
}

// ---------- Accessories ----------
function AccessoryTab({
  data,
  update
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const add = () => {
    if (!name.trim() || num(price) <= 0) return;
    update({
      accessories: [...data.accessories, {
        id: uid(),
        name: name.trim(),
        unitPrice: num(price),
        stockQty: 0
      }]
    });
    setName("");
    setPrice("");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(RestockCard, {
    unit: "pcs",
    lines: data.accessories.filter(a => isLow(a.stockQty, a.minQty)).map(a => ({
      name: a.name,
      stock: num(a.stockQty),
      min: num(a.minQty),
      max: num(a.maxQty) > num(a.minQty) ? num(a.maxQty) : 0,
      buy: restockAmount(a.stockQty, a.minQty, a.maxQty),
      price: num(a.unitPrice)
    }))
  }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Add an accessory"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Accessory name",
    flex: "2 1 200px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "e.g. Brass zipper 30cm, magnet snap, D-ring"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Price per unit (EGP)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: price,
    onChange: e => setPrice(e.target.value),
    placeholder: "e.g. 25"
  })), /*#__PURE__*/React.createElement(Btn, {
    onClick: add,
    style: {
      flex: "0 0 auto"
    }
  }, "Add accessory"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Accessory library"), data.accessories.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: T.inkSoft,
      fontSize: 14
    }
  }, "No accessories yet. Add zippers, snaps, rings, thread spools — anything you buy per unit."), data.accessories.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, isLow(a.stockQty, a.minQty) && /*#__PURE__*/React.createElement(LowBadge, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(EditableRow, {
    fields: [{
      key: "name",
      value: a.name,
      flex: 2
    }, {
      key: "unitPrice",
      value: a.unitPrice,
      type: "number",
      suffix: "EGP"
    }, {
      key: "stockQty",
      value: a.stockQty || 0,
      type: "number",
      suffix: "in stock"
    }, {
      key: "minQty",
      value: a.minQty || 0,
      type: "number",
      suffix: "min"
    }, {
      key: "maxQty",
      value: a.maxQty || 0,
      type: "number",
      suffix: "max"
    }],
    onSave: vals => update({
      accessories: data.accessories.map(x => x.id === a.id ? {
        ...x,
        name: vals.name,
        unitPrice: num(vals.unitPrice),
        stockQty: num(vals.stockQty),
        minQty: num(vals.minQty),
        maxQty: num(vals.maxQty)
      } : x)
    }),
    onDelete: () => update({
      accessories: data.accessories.filter(x => x.id !== a.id)
    })
  }))))));
}
function EditableRow({
  fields,
  onSave,
  onDelete
}) {
  const [editing, setEditing] = useState(false);
  const [vals, setVals] = useState(Object.fromEntries(fields.map(f => [f.key, f.value])));
  useEffect(() => {
    setVals(Object.fromEntries(fields.map(f => [f.key, f.value])));
    // eslint-disable-next-line
  }, [fields.map(f => f.value).join("|")]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "8px 0",
      borderBottom: `1px dashed ${T.line}`,
      flexWrap: "wrap"
    }
  }, fields.map(f => editing ? /*#__PURE__*/React.createElement("input", {
    key: f.key,
    style: {
      ...inputStyle,
      flex: f.flex || 1,
      minWidth: 80
    },
    type: f.type || "text",
    value: vals[f.key],
    onChange: e => setVals({
      ...vals,
      [f.key]: e.target.value
    })
  }) : /*#__PURE__*/React.createElement("span", {
    key: f.key,
    style: {
      flex: f.flex || 1,
      fontSize: 14,
      minWidth: 80
    }
  }, f.type === "number" ? `${Number(f.value).toLocaleString()} ${f.suffix || ""}` : f.value)), editing ? /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: () => {
      onSave(vals);
      setEditing(false);
    }
  }, "Save") : /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "outline",
    onClick: () => setEditing(true)
  }, "Edit"), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "danger",
    onClick: onDelete
  }, "Delete"));
}

// ---------- Item list ----------
function ItemList({
  data,
  update,
  onEdit
}) {
  const newItem = () => {
    const defaults = (data.settings?.defaultOverheads || []).map(o => ({
      ...o,
      id: uid()
    }));
    const item = {
      id: uid(),
      name: "New item",
      photo: null,
      pieces: [],
      accessories: [],
      wastePct: 35,
      actualFt: "",
      overheads: defaults.length ? defaults : [{
        id: uid(),
        name: "Tool depreciation",
        mode: "percent",
        value: 5
      }, {
        id: uid(),
        name: "Other materials",
        mode: "percent",
        value: 5
      }],
      revenueMode: "percent",
      revenueValue: 50,
      pricedCost: 0
    };
    update({
      items: [...data.items, item]
    });
    onEdit(item.id);
  };
  const duplicateItem = it => {
    const c = computeItem(it, data.leathers, data.accessories);
    const copy = {
      ...it,
      id: uid(),
      name: `${it.name} (copy)`,
      pieces: (it.pieces || []).map(p => ({
        ...p,
        id: uid()
      })),
      accessories: (it.accessories || []).map(a => ({
        ...a,
        id: uid()
      })),
      overheads: (it.overheads || []).map(o => ({
        ...o,
        id: uid()
      })),
      pricedCost: c.totalCost
    };
    update({
      items: [...data.items, copy]
    });
    onEdit(copy.id);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 20,
      margin: 0
    }
  }, "Your items"), /*#__PURE__*/React.createElement(Btn, {
    onClick: newItem
  }, "+ New item")), data.items.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      color: T.inkSoft,
      fontSize: 14,
      margin: 0
    }
  }, "Nothing on the bench yet. Add your leathers and accessories first, then create your first item — a tote, a wallet, a belt — and the ticket will price it for you.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
      gap: 14
    }
  }, data.items.map(it => {
    const c = computeItem(it, data.leathers, data.accessories);
    return /*#__PURE__*/React.createElement(Card, {
      key: it.id,
      style: {
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }
    }, it.photo ? /*#__PURE__*/React.createElement("img", {
      src: it.photo,
      alt: it.name,
      style: {
        width: "100%",
        height: 140,
        objectFit: "cover"
      }
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 140,
        background: T.line,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.panel,
        fontFamily: fontDisplay,
        fontSize: 32
      }
    }, it.name.slice(0, 1).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 14,
        display: "grid",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        fontFamily: fontDisplay,
        fontSize: 16
      }
    }, it.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.inkSoft
      }
    }, ft(c.wasteFt), " leather · cost ", egp(c.totalCost)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        color: T.accent,
        fontWeight: 700
      }
    }, "Sell at ", egp(c.sellingPrice)), it.pricedCost !== undefined && Math.abs(c.totalCost - it.pricedCost) > 0.5 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#7A4A00",
        background: "#F5DFA8",
        border: "1.5px solid #C79A3B",
        borderRadius: 6,
        padding: "4px 8px"
      }
    }, "⚠ Cost changed since priced: ", egp(it.pricedCost), " → ", egp(c.totalCost), ". Open to review your price."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement(Btn, {
      small: true,
      onClick: () => onEdit(it.id)
    }, "Open"), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "outline",
      onClick: () => duplicateItem(it)
    }, "Duplicate"), /*#__PURE__*/React.createElement(ConfirmBtn, {
      small: true,
      onConfirm: () => update({
        items: data.items.filter(x => x.id !== it.id)
      })
    }, "Delete"))));
  })));
}

// ---------- Item editor ----------
function ItemEditor({
  item,
  data,
  update,
  onBack
}) {
  const setItem = patch => {
    const next = {
      ...item,
      ...patch
    };
    next.pricedCost = computeItem(next, data.leathers, data.accessories).totalCost;
    update({
      items: data.items.map(x => x.id === item.id ? next : x)
    });
  };
  const [copied, setCopied] = useState(false);
  const [quoteFallback, setQuoteFallback] = useState("");
  const c = computeItem(item, data.leathers, data.accessories);
  const fileRef = useRef(null);

  // new piece form
  const [pName, setPName] = useState("");
  const [pL, setPL] = useState("");
  const [pW, setPW] = useState("");
  const [pQty, setPQty] = useState("1");
  const [pLeather, setPLeather] = useState(data.leathers[0]?.id || "");

  // new accessory form
  const [aId, setAId] = useState(data.accessories[0]?.id || "");
  const [aQty, setAQty] = useState("1");
  const addPiece = () => {
    if (!pName.trim() || num(pL) <= 0 || num(pW) <= 0 || !pLeather) return;
    setItem({
      pieces: [...item.pieces, {
        id: uid(),
        name: pName.trim(),
        lengthCm: num(pL),
        widthCm: num(pW),
        qty: num(pQty) || 1,
        leatherId: pLeather
      }]
    });
    setPName("");
    setPL("");
    setPW("");
    setPQty("1");
  };
  const addAcc = () => {
    if (!aId) return;
    setItem({
      accessories: [...item.accessories, {
        id: uid(),
        accessoryId: aId,
        qty: num(aQty) || 1
      }]
    });
    setAQty("1");
  };
  const onPhoto = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setItem({
        photo: dataUrl
      });
    } catch {
      window.alert("Could not read that image — try another photo.");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "outline",
    onClick: onBack
  }, "← All items"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontFamily: fontDisplay,
      fontSize: 18,
      fontWeight: 700,
      flex: "1 1 200px"
    },
    value: item.name,
    onChange: e => setItem({
      name: e.target.value
    })
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Photo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, item.photo ? /*#__PURE__*/React.createElement("img", {
    src: item.photo,
    alt: item.name,
    style: {
      width: 120,
      height: 120,
      objectFit: "cover",
      borderRadius: 8,
      border: `2px solid ${T.line}`
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 120,
      borderRadius: 8,
      border: `2px dashed ${T.line}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: T.inkSoft,
      fontSize: 12,
      textAlign: "center",
      padding: 6
    }
  }, "No photo yet"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8,
      justifyItems: "start"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: fontBody,
      fontWeight: 600,
      fontSize: 13,
      padding: "8px 14px",
      borderRadius: 6,
      cursor: "pointer",
      border: `1.5px solid ${T.accent}`,
      background: T.accent,
      color: "#F7EFE0",
      display: "inline-block"
    }
  }, item.photo ? "Change photo" : "Add photo", /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    onChange: onPhoto,
    style: {
      display: "none"
    }
  })), item.photo && /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "danger",
    onClick: () => setItem({
      photo: null
    })
  }, "Remove photo")))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Description & work time"), /*#__PURE__*/React.createElement("textarea", {
    value: item.description || "",
    onChange: e => setItem({
      description: e.target.value
    }),
    placeholder: "Free text describing this item — leather type, color, size, features. This goes on the customer quote.",
    style: {
      ...inputStyle,
      height: 80,
      resize: "vertical"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Manufacturing time (hours)",
    flex: "0 1 180px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    step: "0.5",
    value: item.hoursNeeded || "",
    onChange: e => setItem({
      hoursNeeded: e.target.value
    }),
    placeholder: "e.g. 8"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      paddingBottom: 10
    }
  }, "Used in Orders to show your total workload."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Leather pieces (cm)"), data.leathers.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.inkSoft
    }
  }, "Add at least one leather in the Leathers tab first — each piece needs a leather to price against.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Piece name",
    flex: "2 1 160px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: pName,
    onChange: e => setPName(e.target.value),
    placeholder: "e.g. Body panel"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Length (cm)",
    flex: "1 1 90px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: pL,
    onChange: e => setPL(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Width (cm)",
    flex: "1 1 90px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: pW,
    onChange: e => setPW(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Qty",
    flex: "0 1 70px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "1",
    value: pQty,
    onChange: e => setPQty(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Leather",
    flex: "2 1 160px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pLeather,
    onChange: e => setPLeather(e.target.value)
  }, data.leathers.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.name, " — ", l.pricePerFt, " EGP/ft²")))), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: addPiece
  }, "Add piece")), c.pieceRows.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      textAlign: "left",
      color: T.inkSoft
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "6px 8px"
    }
  }, "Piece"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "6px 8px"
    }
  }, "Size"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "6px 8px"
    }
  }, "Leather"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "6px 8px"
    }
  }, "ft² (+waste)"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "6px 8px"
    }
  }, "Cost"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, c.pieceRows.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id,
    style: {
      borderTop: `1px dashed ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px",
      fontWeight: 600
    }
  }, p.name, p.qty > 1 ? ` ×${p.qty}` : ""), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px"
    }
  }, p.lengthCm, "×", p.widthCm, " cm"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px"
    }
  }, p.leatherName), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px"
    }
  }, ft(p.areaWithWaste)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px"
    }
  }, egp(p.cost)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "6px 8px"
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "danger",
    onClick: () => setItem({
      pieces: item.pieces.filter(x => x.id !== p.id)
    })
  }, "✕"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Waste %",
    flex: "0 1 110px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: item.wastePct,
    onChange: e => setItem({
      wastePct: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      paddingBottom: 10
    }
  }, "Raw ", ft(c.rawFt), " → with waste ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, ft(c.wasteFt)), " · leather ", egp(c.leatherCost))), c.rawFt > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: `1px dashed ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-end",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Actual leather used (ft²)",
    flex: "0 1 170px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    step: "0.01",
    value: item.actualFt || "",
    onChange: e => setItem({
      actualFt: e.target.value
    }),
    placeholder: "After you cut"
  })), num(item.actualFt) > 0 && (() => {
    const actualWaste = (num(item.actualFt) / c.rawFt - 1) * 100;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        paddingBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.inkSoft
      }
    }, actualWaste < 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "Less than the pattern area — check the dimensions or the measured ft².") : /*#__PURE__*/React.createElement(React.Fragment, null, "Actual waste: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: actualWaste > num(item.wastePct) ? T.danger : "#3F6E2A"
      }
    }, actualWaste.toFixed(1), "%"), " (assumed ", num(item.wastePct), "%)")), actualWaste >= 0 && Math.abs(actualWaste - num(item.wastePct)) > 0.5 && /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "outline",
      onClick: () => setItem({
        wastePct: Math.round(actualWaste * 10) / 10
      })
    }, "Use ", actualWaste.toFixed(1), "% as waste"));
  })()), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      margin: "6px 0 0"
    }
  }, "After cutting a real piece, measure the leather you actually consumed and enter it here — over time you'll learn the true waste rate for each type of item."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Accessories"), data.accessories.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.inkSoft
    }
  }, "Your accessory library is empty — add zippers, snaps, and rings in the Accessories tab, then attach them here.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Accessory",
    flex: "2 1 180px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: aId,
    onChange: e => setAId(e.target.value)
  }, data.accessories.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name, " — ", a.unitPrice, " EGP")))), /*#__PURE__*/React.createElement(Field, {
    label: "Qty",
    flex: "0 1 70px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "1",
    value: aQty,
    onChange: e => setAQty(e.target.value)
  })), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: addAcc
  }, "Add")), c.accRows.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "6px 0",
      borderTop: `1px dashed ${T.line}`,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 2,
      fontWeight: 600
    }
  }, a.name, " ×", a.qty), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, egp(a.cost)), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "danger",
    onClick: () => setItem({
      accessories: item.accessories.filter(x => x.id !== a.id)
    })
  }, "✕"))), c.accRows.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 13,
      color: T.inkSoft
    }
  }, "Accessories total: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, egp(c.accCost)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Overheads & other costs"), (item.overheads || []).map(o => {
    const row = c.overheadRows.find(r => r.id === o.id);
    return /*#__PURE__*/React.createElement("div", {
      key: o.id,
      style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        flexWrap: "wrap",
        padding: "8px 0",
        borderBottom: `1px dashed ${T.line}`
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Cost name",
      flex: "2 1 150px"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      value: o.name,
      onChange: e => setItem({
        overheads: item.overheads.map(x => x.id === o.id ? {
          ...x,
          name: e.target.value
        } : x)
      }),
      placeholder: "e.g. Marketing, Labor share"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Type",
      flex: "1 1 120px"
    }, /*#__PURE__*/React.createElement("select", {
      style: inputStyle,
      value: o.mode,
      onChange: e => setItem({
        overheads: item.overheads.map(x => x.id === o.id ? {
          ...x,
          mode: e.target.value
        } : x)
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: "percent"
    }, "% of materials"), /*#__PURE__*/React.createElement("option", {
      value: "amount"
    }, "Fixed EGP"))), /*#__PURE__*/React.createElement(Field, {
      label: o.mode === "percent" ? "%" : "EGP",
      flex: "1 1 90px"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      type: "number",
      min: "0",
      value: o.value,
      onChange: e => setItem({
        overheads: item.overheads.map(x => x.id === o.id ? {
          ...x,
          value: e.target.value
        } : x)
      })
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.inkSoft,
        paddingBottom: 10,
        minWidth: 90
      }
    }, "= ", egp(row ? row.cost : 0)), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "danger",
      onClick: () => setItem({
        overheads: item.overheads.filter(x => x.id !== o.id)
      })
    }, "✕"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: () => setItem({
      overheads: [...(item.overheads || []), {
        id: uid(),
        name: "",
        mode: "percent",
        value: 0
      }]
    })
  }, "+ Add cost line")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      marginTop: 10
    }
  }, "\"% of materials\" lines apply to the materials subtotal (leather with waste + accessories). \"Fixed EGP\" lines add a flat amount — useful for labor share, marketing per piece, or packaging.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Target revenue"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Revenue as",
    flex: "1 1 130px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: item.revenueMode,
    onChange: e => setItem({
      revenueMode: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "amount"
  }, "Amount (EGP)"), /*#__PURE__*/React.createElement("option", {
    value: "percent"
  }, "% of cost"), /*#__PURE__*/React.createElement("option", {
    value: "hourly"
  }, "EGP per hour"))), /*#__PURE__*/React.createElement(Field, {
    label: item.revenueMode === "percent" ? "Revenue %" : item.revenueMode === "hourly" ? "Rate (EGP/hour)" : "Revenue (EGP)",
    flex: "1 1 130px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: item.revenueValue,
    onChange: e => setItem({
      revenueValue: e.target.value
    })
  }))), item.revenueMode === "hourly" && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: num(item.hoursNeeded) > 0 ? T.inkSoft : T.danger,
      marginTop: 8,
      marginBottom: 0
    }
  }, num(item.hoursNeeded) > 0 ? `${num(item.revenueValue)} EGP/h × ${num(item.hoursNeeded)} h = ${egp(num(item.revenueValue) * num(item.hoursNeeded))} revenue` : "Set the manufacturing time in the Description & work time card above — revenue is rate × hours.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#FBF5E8",
      border: `2px solid ${T.ink}`,
      borderRadius: 12,
      padding: "18px 20px",
      position: "relative",
      boxShadow: "4px 4px 0 rgba(44,31,18,0.25)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 14,
      right: 18,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: T.bg,
      border: `2px solid ${T.ink}`
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: fontDisplay,
      margin: "0 0 12px",
      fontSize: 18,
      letterSpacing: 1,
      textTransform: "uppercase"
    }
  }, "Cutting ticket — ", item.name), /*#__PURE__*/React.createElement(TicketRow, {
    label: `Leather (${ft(c.wasteFt)} incl. ${item.wastePct}% waste)`,
    value: egp(c.leatherCost)
  }), /*#__PURE__*/React.createElement(TicketRow, {
    label: "Accessories",
    value: egp(c.accCost)
  }), /*#__PURE__*/React.createElement(TicketRow, {
    label: "Materials subtotal",
    value: egp(c.subtotal),
    strong: true
  }), c.overheadRows.map(o => /*#__PURE__*/React.createElement(TicketRow, {
    key: o.id,
    label: `${o.name || "Unnamed cost"}${o.mode === "percent" ? ` (${num(o.value)}%)` : ""}`,
    value: egp(o.cost)
  })), /*#__PURE__*/React.createElement(TicketRow, {
    label: "Total cost",
    value: egp(c.totalCost),
    strong: true
  }), /*#__PURE__*/React.createElement(TicketRow, {
    label: "Revenue",
    value: egp(c.revenue),
    accent: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `2px solid ${T.ink}`,
      marginTop: 10,
      paddingTop: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 16,
      fontWeight: 800
    }
  }, "Selling price"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 24,
      fontWeight: 800,
      color: T.accent
    }
  }, egp(c.sellingPrice))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      marginTop: 8,
      fontSize: 13,
      color: T.inkSoft,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Revenue = ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, c.markupPct.toFixed(1), "%"), " of total cost"), /*#__PURE__*/React.createElement("span", null, "Profit margin = ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: T.ink
    }
  }, c.marginPct.toFixed(1), "%"), " of selling price")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: async () => {
      const lines = [item.name, (item.description || "").trim() || null, `Price: ${egp(c.sellingPrice)}`].filter(Boolean);
      const text = lines.join("\n");
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setQuoteFallback("");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          if (document.execCommand("copy")) {
            setCopied(true);
            setQuoteFallback("");
          } else setQuoteFallback(text);
        } catch {
          setQuoteFallback(text);
        }
        document.body.removeChild(ta);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  }, copied ? "Copied ✓" : "Copy customer quote"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: T.inkSoft
    }
  }, "Name, description, and price — no costs revealed. Paste it straight into WhatsApp.")), quoteFallback && /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: quoteFallback,
    onFocus: e => e.target.select(),
    style: {
      ...inputStyle,
      marginTop: 8,
      height: 80,
      fontSize: 13
    }
  })));
}
function TicketRow({
  label,
  value,
  strong,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "5px 0",
      borderBottom: `1px dashed ${T.line}`,
      fontSize: strong ? 15 : 14,
      fontWeight: strong ? 700 : 400,
      color: accent ? T.accent : T.ink
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, value));
}

// Color selection UI: one select per leather type, expandable to per-piece for mixed designs
function ColorChooser({
  item,
  leathers,
  choices,
  onChange
}) {
  const pieces = pieceNeedsList(item);
  const byLeather = {};
  pieces.forEach(pn => {
    (byLeather[pn.leatherId] = byLeather[pn.leatherId] || []).push(pn);
  });
  const anyMixable = Object.values(byLeather).some(arr => arr.length > 1);
  const isMixed = Object.values(byLeather).some(arr => new Set(arr.map(pn => choices[pn.pieceId])).size > 1);
  const [mix, setMix] = useState(isMixed);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, !(mix || isMixed) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, Object.entries(byLeather).map(([lid, arr]) => {
    const l = leathers.find(x => x.id === lid);
    if (!l) return null;
    const totalFt = arr.reduce((s, pn) => s + pn.ft, 0);
    const common = choices[arr[0].pieceId] || "";
    return /*#__PURE__*/React.createElement(Field, {
      key: lid,
      label: `${l.name} color (${Math.round(totalFt * 100) / 100} ft²)`,
      flex: "1 1 170px"
    }, /*#__PURE__*/React.createElement("select", {
      style: {
        ...inputStyle,
        fontSize: 13,
        padding: "6px 8px"
      },
      value: common,
      onChange: e => {
        const next = {
          ...choices
        };
        arr.forEach(pn => {
          next[pn.pieceId] = e.target.value;
        });
        onChange(next);
      }
    }, (l.colors || []).map(cc => /*#__PURE__*/React.createElement("option", {
      key: cc.id,
      value: cc.id
    }, cc.name, " — ", num(cc.stockFt), " ft²"))));
  })), (mix || isMixed) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, pieces.map(pn => {
    const l = leathers.find(x => x.id === pn.leatherId);
    if (!l) return null;
    return /*#__PURE__*/React.createElement(Field, {
      key: pn.pieceId,
      label: `${pn.name} — ${l.name} (${Math.round(pn.ft * 100) / 100} ft²)`,
      flex: "1 1 170px"
    }, /*#__PURE__*/React.createElement("select", {
      style: {
        ...inputStyle,
        fontSize: 13,
        padding: "6px 8px"
      },
      value: choices[pn.pieceId] || "",
      onChange: e => onChange({
        ...choices,
        [pn.pieceId]: e.target.value
      })
    }, (l.colors || []).map(cc => /*#__PURE__*/React.createElement("option", {
      key: cc.id,
      value: cc.id
    }, cc.name, " — ", num(cc.stockFt), " ft²"))));
  })), anyMixable && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (mix || isMixed) {
        // Collapse: set every piece of each leather to the first piece's color
        const next = {
          ...choices
        };
        Object.values(byLeather).forEach(arr => {
          const first = next[arr[0].pieceId];
          arr.forEach(pn => {
            next[pn.pieceId] = first;
          });
        });
        onChange(next);
        setMix(false);
      } else {
        setMix(true);
      }
    },
    style: {
      background: "none",
      border: "none",
      color: T.accent,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      justifySelf: "start",
      padding: 0,
      textDecoration: "underline",
      fontFamily: fontBody
    }
  }, mix || isMixed ? "← One color per leather" : "Mix colors per piece →"));
}

// ---------- Orders ----------
function OrdersTab({
  data,
  update
}) {
  const orders = data.orders || [];
  const setOrders = next => update({
    orders: next
  });
  const itemById = id => data.items.find(i => i.id === id);
  const [view, setView] = useState("active");
  const [oKind, setOKind] = useState("customer");
  const [oItem, setOItem] = useState(data.items[0]?.id || "");
  const [oName, setOName] = useState("");
  const [oMobile, setOMobile] = useState("");
  const [oAddress, setOAddress] = useState("");
  const [oNotes, setONotes] = useState("");
  const [oDelivery, setODelivery] = useState("");
  const [oDeposit, setODeposit] = useState("");
  const [oColors, setOColors] = useState({});
  const [sellId, setSellId] = useState(null);
  const [sellPrice, setSellPrice] = useState("");
  const firstColor = l => l && l.colors && l.colors[0] ? l.colors[0].id : undefined;
  const leatherById = id => data.leathers.find(l => l.id === id);
  const resolveChoices = (item, chosen) => {
    const out = {};
    pieceNeedsList(item).forEach(pn => {
      out[pn.pieceId] = chosen && (chosen[pn.pieceId] || chosen[pn.leatherId]) || firstColor(leatherById(pn.leatherId));
    });
    return out;
  };

  // leatherId -> colorId -> ft² (from per-piece choices)
  const aggregateByColor = (item, choices) => {
    const agg = {};
    pieceNeedsList(item).forEach(pn => {
      const cid = choices[pn.pieceId];
      if (!agg[pn.leatherId]) agg[pn.leatherId] = {};
      agg[pn.leatherId][cid] = (agg[pn.leatherId][cid] || 0) + pn.ft;
    });
    return agg;
  };

  // Deduct/restore stock for an order's leather needs
  const applyStock = (o, sign, extraOrderPatch) => {
    const it = itemById(o.itemId);
    if (!it) return;
    const agg = aggregateByColor(it, resolveChoices(it, o.colorChoices));
    const newLeathers = data.leathers.map(l => {
      if (!agg[l.id]) return l;
      return {
        ...l,
        colors: (l.colors || []).map(cc => agg[l.id][cc.id] ? {
          ...cc,
          stockFt: Math.round((num(cc.stockFt) + sign * agg[l.id][cc.id]) * 1000) / 1000
        } : cc)
      };
    });
    const accNeeds = {};
    (it.accessories || []).forEach(a => {
      accNeeds[a.accessoryId] = (accNeeds[a.accessoryId] || 0) + (num(a.qty) || 1);
    });
    const newAccessories = data.accessories.map(acc => accNeeds[acc.id] ? {
      ...acc,
      stockQty: num(acc.stockQty) + sign * accNeeds[acc.id]
    } : acc);
    update({
      leathers: newLeathers,
      accessories: newAccessories,
      orders: orders.map(x => x.id === o.id ? {
        ...x,
        ...extraOrderPatch
      } : x)
    });
  };
  const cutOrder = o => applyStock(o, -1, {
    cutAt: new Date().toISOString()
  });
  const uncutOrder = o => applyStock(o, +1, {
    cutAt: undefined
  });
  const addOrder = () => {
    if (!oItem) return;
    if (oKind === "customer" && !oName.trim()) return;
    const it = itemById(oItem);
    setOrders([...orders, {
      id: uid(),
      kind: oKind,
      itemId: oItem,
      itemName: it ? it.name : "",
      customer: oKind === "personal" ? "Personal / testing" : oName.trim(),
      mobile: oKind === "personal" ? "" : oMobile.trim(),
      address: oKind === "personal" ? "" : oAddress.trim(),
      notes: oNotes.trim(),
      deliveryDate: oDelivery,
      deposit: oKind === "personal" ? 0 : num(oDeposit),
      colorChoices: it ? resolveChoices(it, oColors) : {},
      status: "in_progress",
      createdAt: new Date().toISOString()
    }]);
    setOName("");
    setOMobile("");
    setOAddress("");
    setONotes("");
    setODelivery("");
    setODeposit("");
    setOColors({});
  };

  // Personal orders finish without touching the budgets
  const markDone = o => {
    const it = itemById(o.itemId);
    const soldAt = new Date().toISOString();
    let newLeathers = data.leathers;
    let newAccessories = data.accessories;
    let cutPatch = {};
    if (!o.cutAt && it) {
      const agg = aggregateByColor(it, resolveChoices(it, o.colorChoices));
      newLeathers = data.leathers.map(l => {
        if (!agg[l.id]) return l;
        return {
          ...l,
          colors: (l.colors || []).map(cc => agg[l.id][cc.id] ? {
            ...cc,
            stockFt: Math.round((num(cc.stockFt) - agg[l.id][cc.id]) * 1000) / 1000
          } : cc)
        };
      });
      const accNeeds = {};
      (it.accessories || []).forEach(a => {
        accNeeds[a.accessoryId] = (accNeeds[a.accessoryId] || 0) + (num(a.qty) || 1);
      });
      newAccessories = data.accessories.map(acc => accNeeds[acc.id] ? {
        ...acc,
        stockQty: num(acc.stockQty) - accNeeds[acc.id]
      } : acc);
      cutPatch = {
        cutAt: soldAt
      };
    }
    update({
      leathers: newLeathers,
      accessories: newAccessories,
      orders: orders.map(x => x.id === o.id ? {
        ...x,
        ...cutPatch,
        status: "done",
        soldAt
      } : x)
    });
  };
  const startSell = o => {
    const it = itemById(o.itemId);
    const listPrice = it ? computeItem(it, data.leathers, data.accessories).sellingPrice : 0;
    setSellId(o.id);
    setSellPrice(String(Math.round(listPrice)));
  };
  const confirmSell = o => {
    const it = itemById(o.itemId);
    const c = it ? computeItem(it, data.leathers, data.accessories) : null;
    const listPrice = c ? c.sellingPrice : 0;
    const soldAt = new Date().toISOString();
    const sold = num(sellPrice);
    // If the leather was never cut for this order, deduct stock now
    let newLeathers = data.leathers;
    let newAccessories = data.accessories;
    let cutPatch = {};
    if (!o.cutAt && it) {
      const agg = aggregateByColor(it, resolveChoices(it, o.colorChoices));
      newLeathers = data.leathers.map(l => {
        if (!agg[l.id]) return l;
        return {
          ...l,
          colors: (l.colors || []).map(cc => agg[l.id][cc.id] ? {
            ...cc,
            stockFt: Math.round((num(cc.stockFt) - agg[l.id][cc.id]) * 1000) / 1000
          } : cc)
        };
      });
      const accNeeds = {};
      (it.accessories || []).forEach(a => {
        accNeeds[a.accessoryId] = (accNeeds[a.accessoryId] || 0) + (num(a.qty) || 1);
      });
      newAccessories = data.accessories.map(acc => accNeeds[acc.id] ? {
        ...acc,
        stockQty: num(acc.stockQty) - accNeeds[acc.id]
      } : acc);
      cutPatch = {
        cutAt: soldAt
      };
    }
    const newOrders = orders.map(x => x.id === o.id ? {
      ...x,
      ...cutPatch,
      status: "done",
      soldPrice: sold,
      listPrice,
      soldAt
    } : x);
    // Allocate the sale money into budget categories
    const tx = [];
    const noteBase = `Sale: ${it && it.name || o.itemName} — ${o.customer}`;
    const push = (cat, amt) => {
      if (Math.abs(amt) > 0.004) tx.push({
        id: uid(),
        category: cat,
        amount: Math.round(amt * 100) / 100,
        note: noteBase,
        date: soldAt,
        orderId: o.id,
        type: "sale"
      });
    };
    if (c) {
      push("Leather", c.leatherCost);
      push("Accessories", c.accCost);
      c.overheadRows.forEach(or => push((or.name || "").trim() || "Other costs", or.cost));
      push("Profit", sold - c.totalCost);
    } else {
      push("Profit", sold);
    }
    update({
      orders: newOrders,
      budgetTx: [...(data.budgetTx || []), ...tx],
      leathers: newLeathers,
      accessories: newAccessories
    });
    setSellId(null);
    setSellPrice("");
  };
  const active = orders.filter(o => o.status !== "done").sort((a, b) => (a.deliveryDate || "9999").localeCompare(b.deliveryDate || "9999"));
  const totalHours = active.reduce((s, o) => {
    const it = itemById(o.itemId);
    return s + (it ? num(it.hoursNeeded) : 0);
  }, 0);
  const sold = orders.filter(o => o.status === "done").sort((a, b) => (b.soldAt || "").localeCompare(a.soldAt || ""));
  const soldToCustomers = sold.filter(o => o.kind !== "personal");

  // Per-model summary (customer sales only — personal builds carry no money)
  const groups = {};
  soldToCustomers.forEach(o => {
    const key = o.itemId || o.itemName;
    const it = itemById(o.itemId);
    if (!groups[key]) groups[key] = {
      name: it && it.name || o.itemName || "Deleted item",
      count: 0,
      total: 0
    };
    groups[key].count += 1;
    groups[key].total += num(o.soldPrice);
  });
  const summary = Object.values(groups).sort((a, b) => b.count - a.count);
  const totalSold = soldToCustomers.reduce((s, o) => s + num(o.soldPrice), 0);
  const personalDoneCount = sold.length - soldToCustomers.length;
  const dateStr = iso => iso ? new Date(iso).toLocaleDateString("en-GB") : "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: view === "active" ? "solid" : "outline",
    onClick: () => setView("active")
  }, "Active orders (", active.length, ")"), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: view === "history" ? "solid" : "outline",
    onClick: () => setView("history")
  }, "History (", sold.length, ")"), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: view === "customers" ? "solid" : "outline",
    onClick: () => setView("customers")
  }, "Customers")), view === "active" && /*#__PURE__*/React.createElement(React.Fragment, null, (() => {
    const uncut = active.filter(o => !o.cutAt);
    const leatherDemand = {}; // "lid|colorId" -> ft²
    const accDemand = {}; // accessoryId -> qty
    uncut.forEach(o => {
      const it = itemById(o.itemId);
      if (!it) return;
      const choices = resolveChoices(it, o.colorChoices);
      pieceNeedsList(it).forEach(pn => {
        const key = `${pn.leatherId}|${choices[pn.pieceId] || ""}`;
        leatherDemand[key] = (leatherDemand[key] || 0) + pn.ft;
      });
      (it.accessories || []).forEach(a => {
        accDemand[a.accessoryId] = (accDemand[a.accessoryId] || 0) + (num(a.qty) || 1);
      });
    });
    const leatherLines = Object.entries(leatherDemand).map(([key, need]) => {
      const [lid, cid] = key.split("|");
      const l = leatherById(lid);
      const cc = l && (l.colors || []).find(x => x.id === cid);
      const stock = cc ? num(cc.stockFt) : 0;
      const buy = Math.max(0, need - stock);
      return {
        name: `${l ? l.name : "Deleted leather"} — ${cc ? cc.name : "?"}`,
        need,
        stock,
        buy,
        price: l ? num(l.pricePerFt) : 0
      };
    });
    const accLines = Object.entries(accDemand).map(([aid, qty]) => {
      const acc = data.accessories.find(x => x.id === aid);
      const stock = acc ? num(acc.stockQty) : 0;
      const buy = Math.max(0, qty - stock);
      return {
        name: acc ? acc.name : "Deleted accessory",
        qty,
        stock,
        buy,
        price: acc ? num(acc.unitPrice) : 0
      };
    });
    if (leatherLines.length === 0 && accLines.length === 0) return null;
    const totalBuyCost = leatherLines.reduce((s, ln) => s + ln.buy * ln.price, 0) + accLines.reduce((s, ln) => s + ln.buy * ln.price, 0);
    return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Shopping list (orders not yet cut)"), leatherLines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "5px 0",
        borderBottom: `1px dashed ${T.line}`,
        fontSize: 13,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, ln.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: ln.buy > 0.004 ? T.danger : "#3F6E2A"
      }
    }, "need ", Math.round(ln.need * 100) / 100, " ft² · have ", Math.round(ln.stock * 100) / 100, " ft²", ln.buy > 0.004 ? ` → buy ${Math.round(ln.buy * 100) / 100} ft² (~${egp(ln.buy * ln.price)})` : " ✓"))), accLines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
      key: `a${i}`,
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "5px 0",
        borderBottom: `1px dashed ${T.line}`,
        fontSize: 13,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, ln.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: ln.buy > 0 ? T.danger : "#3F6E2A"
      }
    }, "need ", ln.qty, " · have ", ln.stock, ln.buy > 0 ? ` → buy ${ln.buy} (~${egp(ln.buy * ln.price)})` : " ✓"))), totalBuyCost > 0.004 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 13
      }
    }, "To buy: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: T.accent
      }
    }, "~", egp(totalBuyCost))));
  })(), active.length > 0 && /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: "10px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "Workload on the bench: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: fontDisplay,
      color: T.accent
    }
  }, totalHours, " hours"), " across ", active.length, " order", active.length > 1 ? "s" : "", totalHours === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.inkSoft
    }
  }, " — set manufacturing time on your items to see hours here"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "New order"), data.items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.inkSoft
    }
  }, "Create at least one item first — orders are placed against your items.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "This order is for",
    flex: "1 1 160px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: oKind,
    onChange: e => setOKind(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "customer"
  }, "A customer"), /*#__PURE__*/React.createElement("option", {
    value: "personal"
  }, "Myself / testing"))), /*#__PURE__*/React.createElement(Field, {
    label: "Item",
    flex: "2 1 180px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: oItem,
    onChange: e => {
      setOItem(e.target.value);
      setOColors({});
    }
  }, data.items.map(i => {
    const p = computeItem(i, data.leathers, data.accessories).sellingPrice;
    return /*#__PURE__*/React.createElement("option", {
      key: i.id,
      value: i.id
    }, i.name, " — ", Math.round(p), " EGP");
  })))), oKind === "customer" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Customer name",
    flex: "2 1 160px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: oName,
    onChange: e => setOName(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Mobile",
    flex: "1 1 130px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "tel",
    value: oMobile,
    onChange: e => setOMobile(e.target.value)
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Address",
    flex: "1 1 100%"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: oAddress,
    onChange: e => setOAddress(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: oKind === "personal" ? "Target date (optional)" : "Delivery date",
    flex: "1 1 150px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: oDelivery,
    onChange: e => setODelivery(e.target.value)
  })), oKind === "customer" && /*#__PURE__*/React.createElement(Field, {
    label: "Deposit paid (EGP)",
    flex: "1 1 150px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: oDeposit,
    onChange: e => setODeposit(e.target.value),
    placeholder: "0"
  }))), oKind === "personal" && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      margin: 0
    }
  }, "Personal orders use your inventory (leather and accessories are deducted when you cut), but no money is recorded in the budgets."), oItem && itemById(oItem) && pieceNeedsList(itemById(oItem)).length > 0 && /*#__PURE__*/React.createElement(ColorChooser, {
    item: itemById(oItem),
    leathers: data.leathers,
    choices: resolveChoices(itemById(oItem), oColors),
    onChange: setOColors
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Notes",
    flex: "1 1 100%"
  }, /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inputStyle,
      height: 60,
      resize: "vertical"
    },
    value: oNotes,
    onChange: e => setONotes(e.target.value),
    placeholder: "Color change, deadline, deposit paid…"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Btn, {
    onClick: addOrder
  }, "Add order")))), active.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: T.inkSoft
    }
  }, "No orders in progress.")), active.map(o => {
    const it = itemById(o.itemId);
    return /*#__PURE__*/React.createElement(Card, {
      key: o.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "flex-start"
      }
    }, it && it.photo && /*#__PURE__*/React.createElement("img", {
      src: it.photo,
      alt: "",
      style: {
        width: 64,
        height: 64,
        objectFit: "cover",
        borderRadius: 8,
        border: `2px solid ${T.line}`
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: "1 1 220px",
        display: "grid",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        fontFamily: fontDisplay,
        fontSize: 16
      }
    }, it && it.name || o.itemName), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, o.customer, o.mobile ? ` · ${o.mobile}` : ""), o.address && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: T.inkSoft
      }
    }, o.address), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, "Ordered ", dateStr(o.createdAt), it && num(it.hoursNeeded) > 0 ? ` · ~${num(it.hoursNeeded)} h work` : ""), it && pieceNeedsList(it).length > 0 && (o.cutAt ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, Object.entries(aggregateByColor(it, resolveChoices(it, o.colorChoices))).map(([lid, colorMap]) => {
      const l = leatherById(lid);
      if (!l) return null;
      const names = Object.keys(colorMap).map(cid => ((l.colors || []).find(cc => cc.id === cid) || {}).name || "?");
      return `${l.name}: ${names.join(" + ")}`;
    }).filter(Boolean).join(" · ")) : /*#__PURE__*/React.createElement(ColorChooser, {
      item: it,
      leathers: data.leathers,
      choices: resolveChoices(it, o.colorChoices),
      onChange: next => setOrders(orders.map(x => x.id === o.id ? {
        ...x,
        colorChoices: next
      } : x))
    })), o.deliveryDate && (() => {
      const days = Math.ceil((new Date(o.deliveryDate) - new Date()) / 86400000);
      const late = days < 0;
      const soon = days >= 0 && days <= 3;
      return /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: late ? "#fff" : soon ? "#7A4A00" : T.inkSoft,
          background: late ? T.danger : soon ? "#F5DFA8" : "transparent",
          border: late || soon ? `1.5px solid ${late ? T.danger : "#C79A3B"}` : "none",
          borderRadius: 6,
          padding: late || soon ? "3px 8px" : 0,
          justifySelf: "start"
        }
      }, "Delivery ", dateStr(o.deliveryDate + "T00:00:00"), " ", late ? `— ${-days} day${days < -1 ? "s" : ""} overdue!` : days === 0 ? "— today!" : `— in ${days} day${days > 1 ? "s" : ""}`);
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 2
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Delivery",
      flex: "0 1 140px"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        fontSize: 13,
        padding: "6px 8px"
      },
      type: "date",
      value: o.deliveryDate || "",
      onChange: e => setOrders(orders.map(x => x.id === o.id ? {
        ...x,
        deliveryDate: e.target.value
      } : x))
    })), o.kind !== "personal" && /*#__PURE__*/React.createElement(Field, {
      label: "Deposit (EGP)",
      flex: "0 1 110px"
    }, /*#__PURE__*/React.createElement("input", {
      style: {
        ...inputStyle,
        fontSize: 13,
        padding: "6px 8px"
      },
      type: "number",
      min: "0",
      value: o.deposit || "",
      onChange: e => setOrders(orders.map(x => x.id === o.id ? {
        ...x,
        deposit: e.target.value
      } : x))
    })), o.kind !== "personal" && num(o.deposit) > 0 && it && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft,
        alignSelf: "flex-end",
        paddingBottom: 9
      }
    }, "Balance due: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: T.ink
      }
    }, egp(Math.max(0, computeItem(it, data.leathers, data.accessories).sellingPrice - num(o.deposit)))))), /*#__PURE__*/React.createElement("textarea", {
      style: {
        ...inputStyle,
        height: 44,
        resize: "vertical",
        fontSize: 13
      },
      value: o.notes,
      placeholder: "Notes…",
      onChange: e => setOrders(orders.map(x => x.id === o.id ? {
        ...x,
        notes: e.target.value
      } : x))
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 8,
        justifyItems: "stretch"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#7A4A00",
        background: "#F5DFA8",
        border: "1.5px solid #C79A3B",
        borderRadius: 6,
        padding: "4px 8px",
        textAlign: "center"
      }
    }, "In progress"), o.kind === "personal" && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: T.inkSoft,
        border: `1.5px solid ${T.line}`,
        borderRadius: 6,
        padding: "4px 8px",
        textAlign: "center"
      }
    }, "Personal / testing"), it && Object.keys(leatherNeedsFt(it)).length > 0 && (o.cutAt ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#3F6E2A",
        border: "1.5px solid #3F6E2A",
        borderRadius: 6,
        padding: "4px 8px",
        textAlign: "center"
      }
    }, "Leather cut ✓"), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "outline",
      onClick: () => uncutOrder(o)
    }, "Undo cut")) : (() => {
      const agg = aggregateByColor(it, resolveChoices(it, o.colorChoices));
      let shortCount = 0;
      Object.entries(agg).forEach(([lid, colorMap]) => {
        const l = leatherById(lid);
        Object.entries(colorMap).forEach(([cid, need]) => {
          const cc = l && (l.colors || []).find(x => x.id === cid);
          if (!cc || num(cc.stockFt) < need - 0.004) shortCount++;
        });
      });
      (it.accessories || []).forEach(a => {
        const acc = data.accessories.find(x => x.id === a.accessoryId);
        if (!acc || num(acc.stockQty) < (num(a.qty) || 1)) shortCount++;
      });
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Btn, {
        small: true,
        kind: "outline",
        onClick: () => cutOrder(o)
      }, "✂ Cut leather"), shortCount > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: T.danger,
          textAlign: "center"
        }
      }, "Not enough stock (leather color or accessories)!"));
    })()), o.kind === "personal" ? /*#__PURE__*/React.createElement(Btn, {
      small: true,
      onClick: () => markDone(o)
    }, "✓ Mark as done") : sellId === o.id ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Sold price (EGP)"
    }, /*#__PURE__*/React.createElement("input", {
      style: inputStyle,
      type: "number",
      min: "0",
      value: sellPrice,
      onChange: e => setSellPrice(e.target.value)
    })), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      onClick: () => confirmSell(o)
    }, "Confirm sale"), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "outline",
      onClick: () => setSellId(null)
    }, "Cancel")) : /*#__PURE__*/React.createElement(Btn, {
      small: true,
      onClick: () => startSell(o)
    }, "Mark as sold"), /*#__PURE__*/React.createElement(ConfirmBtn, {
      small: true,
      onConfirm: () => setOrders(orders.filter(x => x.id !== o.id))
    }, "Delete"))));
  })), view === "history" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Sales by model"), summary.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: T.inkSoft
    }
  }, "Nothing sold yet — completed orders will appear here.") : /*#__PURE__*/React.createElement(React.Fragment, null, summary.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.name,
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "6px 0",
      borderBottom: `1px dashed ${T.line}`,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, g.name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.inkSoft
    }
  }, g.count, " sold · ", egp(g.total)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      paddingTop: 10,
      fontWeight: 700,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.accent
    }
  }, soldToCustomers.length, " items · ", egp(totalSold))), personalDoneCount > 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      margin: "6px 0 0"
    }
  }, "Plus ", personalDoneCount, " personal/testing build", personalDoneCount > 1 ? "s" : "", " (not counted in sales)."))), sold.map(o => {
    const it = itemById(o.itemId);
    const discount = num(o.listPrice) - num(o.soldPrice);
    return /*#__PURE__*/React.createElement(Card, {
      key: o.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, it && it.photo && /*#__PURE__*/React.createElement("img", {
      src: it.photo,
      alt: "",
      style: {
        width: 52,
        height: 52,
        objectFit: "cover",
        borderRadius: 8,
        border: `2px solid ${T.line}`
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: "1 1 200px",
        display: "grid",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        fontFamily: fontDisplay,
        fontSize: 15
      }
    }, it && it.name || o.itemName), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, o.customer, o.mobile ? ` · ${o.mobile}` : ""), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, o.kind === "personal" ? "Finished" : "Sold", " ", dateStr(o.soldAt)), o.notes && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, o.notes)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 4,
        textAlign: "right"
      }
    }, o.kind === "personal" ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: T.inkSoft,
        border: `1.5px solid ${T.line}`,
        borderRadius: 6,
        padding: "4px 8px",
        justifySelf: "end"
      }
    }, "Personal / testing") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: fontDisplay,
        fontWeight: 800,
        fontSize: 17,
        color: T.accent
      }
    }, egp(num(o.soldPrice))), discount > 0.5 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.danger
      }
    }, "−", egp(discount), " off list (", egp(num(o.listPrice)), ")"), num(o.deposit) > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, "Deposit ", egp(num(o.deposit)), " · rest ", egp(Math.max(0, num(o.soldPrice) - num(o.deposit))))), /*#__PURE__*/React.createElement(Btn, {
      small: true,
      kind: "outline",
      onClick: () => update({
        orders: orders.map(x => x.id === o.id ? {
          ...x,
          status: "in_progress",
          soldPrice: undefined,
          listPrice: undefined,
          soldAt: undefined
        } : x),
        budgetTx: (data.budgetTx || []).filter(t => t.orderId !== o.id)
      })
    }, o.kind === "personal" ? "Undo" : "Undo sale"))));
  })), view === "customers" && (() => {
    const groups = {};
    orders.filter(o => o.kind !== "personal").forEach(o => {
      const key = (o.mobile || "").trim() || `name:${(o.customer || "").trim().toLowerCase()}`;
      if (!groups[key]) groups[key] = {
        name: o.customer,
        mobile: (o.mobile || "").trim(),
        total: 0,
        soldCount: 0,
        activeCount: 0,
        items: [],
        lastDate: ""
      };
      const g = groups[key];
      g.name = o.customer || g.name;
      if (o.status === "done") {
        g.soldCount += 1;
        g.total += num(o.soldPrice);
        g.items.push(o.itemName || (itemById(o.itemId) || {}).name || "Item");
      } else {
        g.activeCount += 1;
      }
      const d = o.soldAt || o.createdAt || "";
      if (d > g.lastDate) g.lastDate = d;
    });
    const list = Object.values(groups).sort((a, b) => b.total - a.total);
    return /*#__PURE__*/React.createElement(React.Fragment, null, list.length === 0 && /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: 14,
        color: T.inkSoft
      }
    }, "No customers yet — they'll appear here as you take orders.")), list.map((g, i) => /*#__PURE__*/React.createElement(Card, {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: "1 1 200px",
        display: "grid",
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        fontFamily: fontDisplay,
        fontSize: 16
      }
    }, g.name), g.mobile && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, g.mobile), g.items.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, "Bought: ", g.items.join(", ")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, "Last order ", dateStr(g.lastDate))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 3,
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: fontDisplay,
        fontWeight: 800,
        fontSize: 17,
        color: T.accent
      }
    }, egp(g.total)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: T.inkSoft
      }
    }, g.soldCount, " bought", g.activeCount > 0 ? ` · ${g.activeCount} in progress` : ""), g.soldCount >= 2 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#3F6E2A",
        border: "1.5px solid #3F6E2A",
        borderRadius: 6,
        padding: "2px 6px",
        justifySelf: "end"
      }
    }, "★ Repeat customer"))))));
  })());
}

// ---------- Budgets ----------
function BudgetsTab({
  data,
  update
}) {
  const tx = data.budgetTx || [];
  const FIXED = ["Leather", "Accessories", "Profit"];

  // Categories: fixed + every overhead name on your items + anything already in transactions
  const catMap = new Map();
  FIXED.forEach(n => catMap.set(n.toLowerCase(), n));
  (data.items || []).forEach(it => (it.overheads || []).forEach(o => {
    const n = (o.name || "").trim();
    if (n && !catMap.has(n.toLowerCase())) catMap.set(n.toLowerCase(), n);
  }));
  tx.forEach(t => {
    const n = (t.category || "").trim();
    if (n && !catMap.has(n.toLowerCase())) catMap.set(n.toLowerCase(), n);
  });
  const cats = [...catMap.values()];
  const balance = name => tx.filter(t => (t.category || "").toLowerCase() === name.toLowerCase()).reduce((s, t) => s + num(t.amount), 0);
  const totalBalance = tx.reduce((s, t) => s + num(t.amount), 0);
  const [pCat, setPCat] = useState("Leather");
  const [pType, setPType] = useState("purchase");
  const [pAmt, setPAmt] = useState("");
  const [pNote, setPNote] = useState("");
  const [pLeather, setPLeather] = useState("");
  const [pColor, setPColor] = useState("");
  const [pFt, setPFt] = useState("");
  const [pAccId, setPAccId] = useState("");
  const [pAccQty, setPAccQty] = useState("");
  const [filter, setFilter] = useState("all");
  const isLeatherPurchase = pType === "purchase" && pCat.toLowerCase() === "leather";
  const isAccPurchase = pType === "purchase" && pCat.toLowerCase() === "accessories";
  const selLeather = data.leathers.find(l => l.id === pLeather);
  const selAcc = data.accessories.find(a => a.id === pAccId);
  const addTx = () => {
    if (num(pAmt) <= 0) return;
    const amt = pType === "purchase" ? -num(pAmt) : num(pAmt);
    let note = pNote.trim();
    let newLeathers = data.leathers;
    let newAccessories = data.accessories;
    // Optionally add purchased leather to a color's stock
    if (isLeatherPurchase && selLeather && pColor && num(pFt) > 0) {
      newLeathers = data.leathers.map(l => l.id === selLeather.id ? {
        ...l,
        colors: (l.colors || []).map(cc => cc.id === pColor ? {
          ...cc,
          stockFt: Math.round((num(cc.stockFt) + num(pFt)) * 1000) / 1000
        } : cc)
      } : l);
      const ccName = ((selLeather.colors || []).find(cc => cc.id === pColor) || {}).name || "";
      note = `${note ? note + " · " : ""}+${num(pFt)} ft² ${selLeather.name} (${ccName})`;
    }
    // Optionally add purchased accessories to stock
    if (isAccPurchase && selAcc && num(pAccQty) > 0) {
      newAccessories = data.accessories.map(a => a.id === selAcc.id ? {
        ...a,
        stockQty: num(a.stockQty) + num(pAccQty)
      } : a);
      note = `${note ? note + " · " : ""}+${num(pAccQty)} × ${selAcc.name}`;
    }
    update({
      leathers: newLeathers,
      accessories: newAccessories,
      budgetTx: [...tx, {
        id: uid(),
        category: pCat,
        amount: amt,
        note,
        date: new Date().toISOString(),
        type: pType
      }]
    });
    setPAmt("");
    setPNote("");
    setPFt("");
    setPAccQty("");
  };
  const shown = tx.filter(t => filter === "all" || (t.category || "").toLowerCase() === filter.toLowerCase()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const dateStr = iso => iso ? new Date(iso).toLocaleDateString("en-GB") : "";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
      gap: 10
    }
  }, cats.map(c => {
    const b = balance(c);
    const isProfit = c.toLowerCase() === "profit";
    return /*#__PURE__*/React.createElement(Card, {
      key: c,
      style: {
        padding: 12,
        ...(isProfit ? {
          borderStyle: "solid",
          borderColor: T.accent
        } : {})
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: T.inkSoft
      }
    }, c), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: fontDisplay,
        fontWeight: 800,
        fontSize: 18,
        marginTop: 4,
        color: b < -0.004 ? T.danger : isProfit ? T.accent : T.ink
      }
    }, egp(b)));
  })), /*#__PURE__*/React.createElement(Card, {
    style: {
      padding: "10px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "Total across all budgets: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: fontDisplay,
      color: totalBalance < 0 ? T.danger : T.accent
    }
  }, egp(totalBalance)))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Record a transaction"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Type",
    flex: "1 1 130px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pType,
    onChange: e => setPType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "purchase"
  }, "Purchase (take out)"), /*#__PURE__*/React.createElement("option", {
    value: "deposit"
  }, "Add money (put in)"))), /*#__PURE__*/React.createElement(Field, {
    label: "Budget",
    flex: "1 1 140px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pCat,
    onChange: e => setPCat(e.target.value)
  }, cats.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement(Field, {
    label: "Amount (EGP)",
    flex: "1 1 110px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: pAmt,
    onChange: e => setPAmt(e.target.value)
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Note",
    flex: "2 1 180px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: pNote,
    onChange: e => setPNote(e.target.value),
    placeholder: "e.g. Bought 12 ft² crazy horse"
  })), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: addTx
  }, "Record")), isLeatherPurchase && data.leathers.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end",
      marginTop: 10,
      paddingTop: 10,
      borderTop: `1px dashed ${T.line}`
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Add to stock (optional)",
    flex: "2 1 160px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pLeather,
    onChange: e => {
      setPLeather(e.target.value);
      setPColor("");
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "— Don't update stock —"), data.leathers.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.name)))), selLeather && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
    label: "Color",
    flex: "1 1 130px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pColor,
    onChange: e => setPColor(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Choose color"), (selLeather.colors || []).map(cc => /*#__PURE__*/React.createElement("option", {
    key: cc.id,
    value: cc.id
  }, cc.name)))), /*#__PURE__*/React.createElement(Field, {
    label: "ft² bought",
    flex: "0 1 100px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    step: "0.1",
    value: pFt,
    onChange: e => setPFt(e.target.value)
  })))), isAccPurchase && data.accessories.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end",
      marginTop: 10,
      paddingTop: 10,
      borderTop: `1px dashed ${T.line}`
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Add to stock (optional)",
    flex: "2 1 160px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: pAccId,
    onChange: e => setPAccId(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "— Don't update stock —"), data.accessories.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), selAcc && /*#__PURE__*/React.createElement(Field, {
    label: "Quantity bought",
    flex: "0 1 120px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: pAccQty,
    onChange: e => setPAccQty(e.target.value)
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      marginTop: 10
    }
  }, "Sales fill these budgets automatically when you mark an order as sold. Use this form for real-world purchases (leather, hardware, ads, tools) or to add your own money to a budget.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, null, "Transactions"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      width: "auto"
    },
    value: filter,
    onChange: e => setFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All budgets"), cats.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), shown.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: T.inkSoft
    }
  }, "No transactions yet. Sell an item or record a purchase to get started."), shown.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "8px 0",
      borderBottom: `1px dashed ${T.line}`,
      fontSize: 13,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.inkSoft,
      flex: "0 0 74px"
    }
  }, dateStr(t.date)), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 100px",
      fontWeight: 700
    }
  }, t.category), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "1 1 160px",
      color: T.inkSoft
    }
  }, t.note || (t.type === "sale" ? "Sale allocation" : "")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      color: num(t.amount) < 0 ? T.danger : "#3F6E2A"
    }
  }, num(t.amount) >= 0 ? "+" : "", egp(num(t.amount))), t.type !== "sale" ? /*#__PURE__*/React.createElement(ConfirmBtn, {
    small: true,
    onConfirm: () => update({
      budgetTx: tx.filter(x => x.id !== t.id)
    })
  }, "✕") : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: T.inkSoft
    }
  }, "auto"))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      marginTop: 10
    }
  }, "Entries marked \"auto\" come from sales — to remove one, use \"Undo sale\" on that order in the Orders history.")));
}

// ---------- Settings ----------
function SettingsTab({
  data,
  update,
  setData
}) {
  const [backupText, setBackupText] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [copied, setCopied] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const settings = data.settings || {
    defaultOverheads: []
  };
  const setDefaults = defaultOverheads => update({
    settings: {
      ...settings,
      defaultOverheads
    }
  });
  const makeBackup = () => setBackupText(JSON.stringify(data, null, 2));
  const downloadBackup = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cutting-ticket-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const loadBackupObject = (parsed, msgSetter) => {
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.leathers) || !Array.isArray(parsed.accessories)) {
      msgSetter("That doesn't look like a Cutting Ticket backup — items, leathers, or accessories missing.");
      return;
    }
    parsed.orders = parsed.orders || [];
    parsed.budgetTx = parsed.budgetTx || [];
    setData(parsed);
    msgSetter("Restored successfully ✓");
    setTimeout(() => msgSetter(""), 4000);
  };
  const restoreFromFile = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        loadBackupObject(JSON.parse(reader.result), setRestoreMsg);
      } catch {
        setRestoreMsg("Could not read that file — make sure it's a Cutting Ticket backup .json file.");
      }
    };
    reader.onerror = () => setRestoreMsg("Could not read that file.");
    reader.readAsText(file);
    e.target.value = "";
  };
  const copyBackup = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(backupText);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = backupText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setRestoreMsg("");
    } else {
      setRestoreMsg("Automatic copy is blocked here — tap inside the backup text (it selects everything), then use your phone's Copy option.");
    }
  };
  const restore = () => {
    if (!restoreText.trim()) {
      setRestoreMsg("Paste a backup first.");
      return;
    }
    try {
      loadBackupObject(JSON.parse(restoreText), setRestoreMsg);
      setRestoreText("");
    } catch {
      setRestoreMsg("Could not read that backup — make sure you pasted the complete text, from the first { to the last }.");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Default cost lines for new items"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      marginTop: 0
    }
  }, "Every new item starts with these lines already filled in. Existing items are not affected."), (settings.defaultOverheads || []).map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
      flexWrap: "wrap",
      padding: "8px 0",
      borderBottom: `1px dashed ${T.line}`
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Cost name",
    flex: "2 1 150px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: o.name,
    onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
      ...x,
      name: e.target.value
    } : x)),
    placeholder: "e.g. Marketing"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Type",
    flex: "1 1 120px"
  }, /*#__PURE__*/React.createElement("select", {
    style: inputStyle,
    value: o.mode,
    onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
      ...x,
      mode: e.target.value
    } : x))
  }, /*#__PURE__*/React.createElement("option", {
    value: "percent"
  }, "% of materials"), /*#__PURE__*/React.createElement("option", {
    value: "amount"
  }, "Fixed EGP"))), /*#__PURE__*/React.createElement(Field, {
    label: o.mode === "percent" ? "%" : "EGP",
    flex: "1 1 90px"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    value: o.value,
    onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
      ...x,
      value: e.target.value
    } : x))
  })), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "danger",
    onClick: () => setDefaults(settings.defaultOverheads.filter(x => x.id !== o.id))
  }, "✕"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: () => setDefaults([...(settings.defaultOverheads || []), {
      id: uid(),
      name: "",
      mode: "percent",
      value: 0
    }])
  }, "+ Add default line"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Backup"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      marginTop: 0
    }
  }, "Download a backup file — leathers, accessories, items, photos, orders, and budgets. Save it to Google Drive, email it to yourself, or move it to another phone or your PC."), /*#__PURE__*/React.createElement(Btn, {
    small: true,
    onClick: downloadBackup
  }, "⬇ Download backup file"), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontSize: 13,
      color: T.inkSoft
    }
  }, "Or copy as text (for pasting into an email)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "outline",
    onClick: makeBackup
  }, "Create text backup"), backupText && /*#__PURE__*/React.createElement(Btn, {
    small: true,
    kind: "outline",
    onClick: copyBackup
  }, copied ? "Copied ✓" : "Copy backup text")), backupText && /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: backupText,
    style: {
      ...inputStyle,
      marginTop: 10,
      height: 120,
      fontFamily: "monospace",
      fontSize: 11
    },
    onFocus: e => e.target.select()
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionTitle, null, "Restore from backup"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      marginTop: 0
    }
  }, "Choose a backup file to restore. This replaces everything currently in the app."), /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: fontBody,
      fontWeight: 600,
      fontSize: 14,
      padding: "10px 18px",
      borderRadius: 6,
      cursor: "pointer",
      border: `1.5px solid ${T.ink}`,
      background: "transparent",
      color: T.ink,
      display: "inline-block"
    }
  }, "Choose backup file…", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "application/json,.json",
    onChange: restoreFromFile,
    style: {
      display: "none"
    }
  })), restoreMsg && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: T.inkSoft,
      marginTop: 8
    }
  }, restoreMsg), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontSize: 13,
      color: T.inkSoft
    }
  }, "Or paste backup text instead"), /*#__PURE__*/React.createElement("textarea", {
    value: restoreText,
    onChange: e => setRestoreText(e.target.value),
    placeholder: "Paste backup text here",
    style: {
      ...inputStyle,
      height: 100,
      fontFamily: "monospace",
      fontSize: 11,
      marginTop: 10
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(ConfirmBtn, {
    small: true,
    onConfirm: restore,
    confirmLabel: "Tap again — replaces ALL data"
  }, "Restore from text")))));
}