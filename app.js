import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
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
  return /*#__PURE__*/_jsxDEV("label", {
    style: {
      display: "block",
      flex: flex || "1 1 120px",
      minWidth: 0
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: T.inkSoft,
        marginBottom: 4,
        fontFamily: fontBody
      },
      children: label
    }, void 0, false), children]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("button", {
    onClick: onClick,
    style: base,
    children: children
  }, void 0, false);
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
  return /*#__PURE__*/_jsxDEV(Btn, {
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
    },
    children: armed ? confirmLabel || "Tap again to confirm" : children
  }, void 0, false);
}
function Card({
  children,
  style
}) {
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      background: T.panel,
      border: `2px dashed ${T.line}`,
      borderRadius: 10,
      padding: 16,
      ...style
    },
    children: children
  }, void 0, false);
}
function SectionTitle({
  children
}) {
  return /*#__PURE__*/_jsxDEV("h3", {
    style: {
      fontFamily: fontDisplay,
      fontSize: 16,
      margin: "0 0 10px",
      color: T.ink,
      letterSpacing: 0.3
    },
    children: children
  }, void 0, false);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      minHeight: "100vh",
      background: T.bg,
      color: T.ink,
      fontFamily: fontBody,
      padding: "0 0 60px"
    },
    children: [/*#__PURE__*/_jsxDEV("style", {
      children: `
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@600;800&display=swap');
        input:focus, select:focus { outline: 2px solid ${T.brass}; }
        button:focus-visible { outline: 2px solid ${T.brass}; }
      `
    }, void 0, false), /*#__PURE__*/_jsxDEV("header", {
      style: {
        background: T.ink,
        color: "#EFE3CC",
        padding: "20px 20px 16px",
        borderBottom: `4px solid ${T.brass}`
      },
      children: [/*#__PURE__*/_jsxDEV("div", {
        style: {
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV("h1", {
          style: {
            fontFamily: fontDisplay,
            fontSize: 24,
            margin: 0,
            letterSpacing: 0.5
          },
          children: "The Cutting Ticket"
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontSize: 13,
            color: "#C9B58E"
          },
          children: "leather goods costing & pricing"
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            marginLeft: "auto",
            fontSize: 12,
            color: "#C9B58E"
          },
          children: saveNote
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        style: {
          maxWidth: 860,
          margin: "14px auto 0",
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        },
        children: [["items", "Items"], ["orders", "Orders"], ["budgets", "Budgets"], ["leathers", "Leathers"], ["accessories", "Accessories"], ["settings", "Settings"]].map(([k, label]) => /*#__PURE__*/_jsxDEV("button", {
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
          },
          children: label
        }, k, false))
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("main", {
      style: {
        maxWidth: 860,
        margin: "24px auto 0",
        padding: "0 16px"
      },
      children: [!loaded && /*#__PURE__*/_jsxDEV("p", {
        children: "Loading your workshop…"
      }, void 0, false), loaded && tab === "leathers" && /*#__PURE__*/_jsxDEV(LeatherTab, {
        data: data,
        update: update
      }, void 0, false), loaded && tab === "accessories" && /*#__PURE__*/_jsxDEV(AccessoryTab, {
        data: data,
        update: update
      }, void 0, false), loaded && tab === "settings" && /*#__PURE__*/_jsxDEV(SettingsTab, {
        data: data,
        update: update,
        setData: setData
      }, void 0, false), loaded && tab === "orders" && /*#__PURE__*/_jsxDEV(OrdersTab, {
        data: data,
        update: update
      }, void 0, false), loaded && tab === "budgets" && /*#__PURE__*/_jsxDEV(BudgetsTab, {
        data: data,
        update: update
      }, void 0, false), loaded && tab === "items" && !editingItem && /*#__PURE__*/_jsxDEV(ItemList, {
        data: data,
        update: update,
        onEdit: setEditingId
      }, void 0, false), loaded && tab === "items" && editingItem && /*#__PURE__*/_jsxDEV(ItemEditor, {
        item: editingItem,
        data: data,
        update: update,
        onBack: () => setEditingId(null)
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Add a leather"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Leather name",
          flex: "2 1 200px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            value: name,
            onChange: e => setName(e.target.value),
            placeholder: "e.g. Crazy horse 1.6mm, dark brown"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Price per ft² (EGP)",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: price,
            onChange: e => setPrice(e.target.value),
            placeholder: "e.g. 180"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          onClick: add,
          style: {
            flex: "0 0 auto"
          },
          children: "Add leather"
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Leather library"
      }, void 0, false), data.leathers.length === 0 && /*#__PURE__*/_jsxDEV("p", {
        style: {
          color: T.inkSoft,
          fontSize: 14
        },
        children: "No leathers yet. Add the hides you buy, priced per square foot, and you'll pick them when building an item."
      }, void 0, false), data.leathers.map(l => /*#__PURE__*/_jsxDEV("div", {
        style: {
          borderBottom: `1px solid ${T.line}`,
          paddingBottom: 10,
          marginBottom: 6
        },
        children: [/*#__PURE__*/_jsxDEV(EditableRow, {
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
        }, void 0, false), /*#__PURE__*/_jsxDEV(ColorStock, {
          leather: l,
          onChange: colors => update({
            leathers: data.leathers.map(x => x.id === l.id ? {
              ...x,
              colors
            } : x)
          })
        }, void 0, false)]
      }, l.id, true))]
    }, void 0, true)]
  }, void 0, true);
}
function ColorStock({
  leather,
  onChange
}) {
  const colors = leather.colors || [];
  const [cName, setCName] = useState("");
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      marginLeft: 4,
      marginTop: 6
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: T.inkSoft,
        marginBottom: 4
      },
      children: "Colors & stock"
    }, void 0, false), colors.map(c => /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        padding: "4px 0",
        fontSize: 13,
        flexWrap: "wrap"
      },
      children: [/*#__PURE__*/_jsxDEV(Field, {
        label: "Color name",
        flex: "2 1 130px",
        children: /*#__PURE__*/_jsxDEV("input", {
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
        }, void 0, false)
      }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
        label: "Stock (ft²)",
        flex: "0 1 90px",
        children: /*#__PURE__*/_jsxDEV("input", {
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
        }, void 0, false)
      }, void 0, false), /*#__PURE__*/_jsxDEV(ConfirmBtn, {
        small: true,
        onConfirm: () => onChange(colors.filter(x => x.id !== c.id)),
        children: "✕"
      }, void 0, false)]
    }, c.id, true)), /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginTop: 6
      },
      children: [/*#__PURE__*/_jsxDEV("input", {
        style: {
          ...inputStyle,
          flex: "0 1 160px",
          fontSize: 13,
          padding: "6px 8px"
        },
        value: cName,
        onChange: e => setCName(e.target.value),
        placeholder: "New color name"
      }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
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
        },
        children: "+ Color"
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Add an accessory"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Accessory name",
          flex: "2 1 200px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            value: name,
            onChange: e => setName(e.target.value),
            placeholder: "e.g. Brass zipper 30cm, magnet snap, D-ring"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Price per unit (EGP)",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: price,
            onChange: e => setPrice(e.target.value),
            placeholder: "e.g. 25"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          onClick: add,
          style: {
            flex: "0 0 auto"
          },
          children: "Add accessory"
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Accessory library"
      }, void 0, false), data.accessories.length === 0 && /*#__PURE__*/_jsxDEV("p", {
        style: {
          color: T.inkSoft,
          fontSize: 14
        },
        children: "No accessories yet. Add zippers, snaps, rings, thread spools — anything you buy per unit."
      }, void 0, false), data.accessories.map(a => /*#__PURE__*/_jsxDEV(EditableRow, {
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
        }],
        onSave: vals => update({
          accessories: data.accessories.map(x => x.id === a.id ? {
            ...x,
            name: vals.name,
            unitPrice: num(vals.unitPrice),
            stockQty: num(vals.stockQty)
          } : x)
        }),
        onDelete: () => update({
          accessories: data.accessories.filter(x => x.id !== a.id)
        })
      }, a.id, false))]
    }, void 0, true)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "8px 0",
      borderBottom: `1px dashed ${T.line}`,
      flexWrap: "wrap"
    },
    children: [fields.map(f => editing ? /*#__PURE__*/_jsxDEV("input", {
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
    }, f.key, false) : /*#__PURE__*/_jsxDEV("span", {
      style: {
        flex: f.flex || 1,
        fontSize: 14,
        minWidth: 80
      },
      children: f.type === "number" ? `${Number(f.value).toLocaleString()} ${f.suffix || ""}` : f.value
    }, f.key, false)), editing ? /*#__PURE__*/_jsxDEV(Btn, {
      small: true,
      onClick: () => {
        onSave(vals);
        setEditing(false);
      },
      children: "Save"
    }, void 0, false) : /*#__PURE__*/_jsxDEV(Btn, {
      small: true,
      kind: "outline",
      onClick: () => setEditing(true),
      children: "Edit"
    }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
      small: true,
      kind: "danger",
      onClick: onDelete,
      children: "Delete"
    }, void 0, false)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      children: [/*#__PURE__*/_jsxDEV("h2", {
        style: {
          fontFamily: fontDisplay,
          fontSize: 20,
          margin: 0
        },
        children: "Your items"
      }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
        onClick: newItem,
        children: "+ New item"
      }, void 0, false)]
    }, void 0, true), data.items.length === 0 && /*#__PURE__*/_jsxDEV(Card, {
      children: /*#__PURE__*/_jsxDEV("p", {
        style: {
          color: T.inkSoft,
          fontSize: 14,
          margin: 0
        },
        children: "Nothing on the bench yet. Add your leathers and accessories first, then create your first item — a tote, a wallet, a belt — and the ticket will price it for you."
      }, void 0, false)
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
        gap: 14
      },
      children: data.items.map(it => {
        const c = computeItem(it, data.leathers, data.accessories);
        return /*#__PURE__*/_jsxDEV(Card, {
          style: {
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          },
          children: [it.photo ? /*#__PURE__*/_jsxDEV("img", {
            src: it.photo,
            alt: it.name,
            style: {
              width: "100%",
              height: 140,
              objectFit: "cover"
            }
          }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
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
            },
            children: it.name.slice(0, 1).toUpperCase()
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            style: {
              padding: 14,
              display: "grid",
              gap: 6
            },
            children: [/*#__PURE__*/_jsxDEV("strong", {
              style: {
                fontFamily: fontDisplay,
                fontSize: 16
              },
              children: it.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              style: {
                fontSize: 13,
                color: T.inkSoft
              },
              children: [ft(c.wasteFt), " leather · cost ", egp(c.totalCost)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
              style: {
                fontSize: 14,
                color: T.accent,
                fontWeight: 700
              },
              children: ["Sell at ", egp(c.sellingPrice)]
            }, void 0, true), it.pricedCost !== undefined && Math.abs(c.totalCost - it.pricedCost) > 0.5 && /*#__PURE__*/_jsxDEV("span", {
              style: {
                fontSize: 12,
                fontWeight: 700,
                color: "#7A4A00",
                background: "#F5DFA8",
                border: "1.5px solid #C79A3B",
                borderRadius: 6,
                padding: "4px 8px"
              },
              children: ["⚠ Cost changed since priced: ", egp(it.pricedCost), " → ", egp(c.totalCost), ". Open to review your price."]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              style: {
                display: "flex",
                gap: 8,
                marginTop: 4,
                flexWrap: "wrap"
              },
              children: [/*#__PURE__*/_jsxDEV(Btn, {
                small: true,
                onClick: () => onEdit(it.id),
                children: "Open"
              }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
                small: true,
                kind: "outline",
                onClick: () => duplicateItem(it),
                children: "Duplicate"
              }, void 0, false), /*#__PURE__*/_jsxDEV(ConfirmBtn, {
                small: true,
                onConfirm: () => update({
                  items: data.items.filter(x => x.id !== it.id)
                }),
                children: "Delete"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true)]
        }, it.id, true);
      })
    }, void 0, false)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap"
      },
      children: [/*#__PURE__*/_jsxDEV(Btn, {
        small: true,
        kind: "outline",
        onClick: onBack,
        children: "← All items"
      }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
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
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Photo"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap"
        },
        children: [item.photo ? /*#__PURE__*/_jsxDEV("img", {
          src: item.photo,
          alt: item.name,
          style: {
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: 8,
            border: `2px solid ${T.line}`
          }
        }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
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
          },
          children: "No photo yet"
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          style: {
            display: "grid",
            gap: 8,
            justifyItems: "start"
          },
          children: [/*#__PURE__*/_jsxDEV("label", {
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
            },
            children: [item.photo ? "Change photo" : "Add photo", /*#__PURE__*/_jsxDEV("input", {
              ref: fileRef,
              type: "file",
              accept: "image/*",
              onChange: onPhoto,
              style: {
                display: "none"
              }
            }, void 0, false)]
          }, void 0, true), item.photo && /*#__PURE__*/_jsxDEV(Btn, {
            small: true,
            kind: "danger",
            onClick: () => setItem({
              photo: null
            }),
            children: "Remove photo"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Description & work time"
      }, void 0, false), /*#__PURE__*/_jsxDEV("textarea", {
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
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          marginTop: 10,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Manufacturing time (hours)",
          flex: "0 1 180px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            step: "0.5",
            value: item.hoursNeeded || "",
            onChange: e => setItem({
              hoursNeeded: e.target.value
            }),
            placeholder: "e.g. 8"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontSize: 13,
            color: T.inkSoft,
            paddingBottom: 10
          },
          children: "Used in Orders to show your total workload."
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Leather pieces (cm)"
      }, void 0, false), data.leathers.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 14,
          color: T.inkSoft
        },
        children: "Add at least one leather in the Leathers tab first — each piece needs a leather to price against."
      }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 12
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Piece name",
          flex: "2 1 160px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            value: pName,
            onChange: e => setPName(e.target.value),
            placeholder: "e.g. Body panel"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Length (cm)",
          flex: "1 1 90px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: pL,
            onChange: e => setPL(e.target.value)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Width (cm)",
          flex: "1 1 90px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: pW,
            onChange: e => setPW(e.target.value)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Qty",
          flex: "0 1 70px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "1",
            value: pQty,
            onChange: e => setPQty(e.target.value)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Leather",
          flex: "2 1 160px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: pLeather,
            onChange: e => setPLeather(e.target.value),
            children: data.leathers.map(l => /*#__PURE__*/_jsxDEV("option", {
              value: l.id,
              children: [l.name, " — ", l.pricePerFt, " EGP/ft²"]
            }, l.id, true))
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          onClick: addPiece,
          children: "Add piece"
        }, void 0, false)]
      }, void 0, true), c.pieceRows.length > 0 && /*#__PURE__*/_jsxDEV("div", {
        style: {
          overflowX: "auto"
        },
        children: /*#__PURE__*/_jsxDEV("table", {
          style: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13
          },
          children: [/*#__PURE__*/_jsxDEV("thead", {
            children: /*#__PURE__*/_jsxDEV("tr", {
              style: {
                textAlign: "left",
                color: T.inkSoft
              },
              children: [/*#__PURE__*/_jsxDEV("th", {
                style: {
                  padding: "6px 8px"
                },
                children: "Piece"
              }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                style: {
                  padding: "6px 8px"
                },
                children: "Size"
              }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                style: {
                  padding: "6px 8px"
                },
                children: "Leather"
              }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                style: {
                  padding: "6px 8px"
                },
                children: "ft² (+waste)"
              }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                style: {
                  padding: "6px 8px"
                },
                children: "Cost"
              }, void 0, false), /*#__PURE__*/_jsxDEV("th", {}, void 0, false)]
            }, void 0, true)
          }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
            children: c.pieceRows.map(p => /*#__PURE__*/_jsxDEV("tr", {
              style: {
                borderTop: `1px dashed ${T.line}`
              },
              children: [/*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px",
                  fontWeight: 600
                },
                children: [p.name, p.qty > 1 ? ` ×${p.qty}` : ""]
              }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px"
                },
                children: [p.lengthCm, "×", p.widthCm, " cm"]
              }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px"
                },
                children: p.leatherName
              }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px"
                },
                children: ft(p.areaWithWaste)
              }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px"
                },
                children: egp(p.cost)
              }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                style: {
                  padding: "6px 8px"
                },
                children: /*#__PURE__*/_jsxDEV(Btn, {
                  small: true,
                  kind: "danger",
                  onClick: () => setItem({
                    pieces: item.pieces.filter(x => x.id !== p.id)
                  }),
                  children: "✕"
                }, void 0, false)
              }, void 0, false)]
            }, p.id, true))
          }, void 0, false)]
        }, void 0, true)
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          marginTop: 12,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Waste %",
          flex: "0 1 110px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: item.wastePct,
            onChange: e => setItem({
              wastePct: e.target.value
            })
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          style: {
            fontSize: 13,
            color: T.inkSoft,
            paddingBottom: 10
          },
          children: ["Raw ", ft(c.rawFt), " → with waste ", /*#__PURE__*/_jsxDEV("strong", {
            style: {
              color: T.ink
            },
            children: ft(c.wasteFt)
          }, void 0, false), " · leather ", egp(c.leatherCost)]
        }, void 0, true)]
      }, void 0, true), c.rawFt > 0 && /*#__PURE__*/_jsxDEV("div", {
        style: {
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px dashed ${T.line}`
        },
        children: [/*#__PURE__*/_jsxDEV("div", {
          style: {
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            flexWrap: "wrap"
          },
          children: [/*#__PURE__*/_jsxDEV(Field, {
            label: "Actual leather used (ft²)",
            flex: "0 1 170px",
            children: /*#__PURE__*/_jsxDEV("input", {
              style: inputStyle,
              type: "number",
              min: "0",
              step: "0.01",
              value: item.actualFt || "",
              onChange: e => setItem({
                actualFt: e.target.value
              }),
              placeholder: "After you cut"
            }, void 0, false)
          }, void 0, false), num(item.actualFt) > 0 && (() => {
            const actualWaste = (num(item.actualFt) / c.rawFt - 1) * 100;
            return /*#__PURE__*/_jsxDEV("div", {
              style: {
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                paddingBottom: 4
              },
              children: [/*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 13,
                  color: T.inkSoft
                },
                children: actualWaste < 0 ? /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: "Less than the pattern area — check the dimensions or the measured ft²."
                }, void 0, false) : /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: ["Actual waste: ", /*#__PURE__*/_jsxDEV("strong", {
                    style: {
                      color: actualWaste > num(item.wastePct) ? T.danger : "#3F6E2A"
                    },
                    children: [actualWaste.toFixed(1), "%"]
                  }, void 0, true), " (assumed ", num(item.wastePct), "%)"]
                }, void 0, true)
              }, void 0, false), actualWaste >= 0 && Math.abs(actualWaste - num(item.wastePct)) > 0.5 && /*#__PURE__*/_jsxDEV(Btn, {
                small: true,
                kind: "outline",
                onClick: () => setItem({
                  wastePct: Math.round(actualWaste * 10) / 10
                }),
                children: ["Use ", actualWaste.toFixed(1), "% as waste"]
              }, void 0, true)]
            }, void 0, true);
          })()]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          style: {
            fontSize: 12,
            color: T.inkSoft,
            margin: "6px 0 0"
          },
          children: "After cutting a real piece, measure the leather you actually consumed and enter it here — over time you'll learn the true waste rate for each type of item."
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Accessories"
      }, void 0, false), data.accessories.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 14,
          color: T.inkSoft
        },
        children: "Your accessory library is empty — add zippers, snaps, and rings in the Accessories tab, then attach them here."
      }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 10
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Accessory",
          flex: "2 1 180px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: aId,
            onChange: e => setAId(e.target.value),
            children: data.accessories.map(a => /*#__PURE__*/_jsxDEV("option", {
              value: a.id,
              children: [a.name, " — ", a.unitPrice, " EGP"]
            }, a.id, true))
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Qty",
          flex: "0 1 70px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "1",
            value: aQty,
            onChange: e => setAQty(e.target.value)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          onClick: addAcc,
          children: "Add"
        }, void 0, false)]
      }, void 0, true), c.accRows.map(a => /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "6px 0",
          borderTop: `1px dashed ${T.line}`,
          fontSize: 13
        },
        children: [/*#__PURE__*/_jsxDEV("span", {
          style: {
            flex: 2,
            fontWeight: 600
          },
          children: [a.name, " ×", a.qty]
        }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
          style: {
            flex: 1
          },
          children: egp(a.cost)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          kind: "danger",
          onClick: () => setItem({
            accessories: item.accessories.filter(x => x.id !== a.id)
          }),
          children: "✕"
        }, void 0, false)]
      }, a.id, true)), c.accRows.length > 0 && /*#__PURE__*/_jsxDEV("div", {
        style: {
          marginTop: 8,
          fontSize: 13,
          color: T.inkSoft
        },
        children: ["Accessories total: ", /*#__PURE__*/_jsxDEV("strong", {
          style: {
            color: T.ink
          },
          children: egp(c.accCost)
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Overheads & other costs"
      }, void 0, false), (item.overheads || []).map(o => {
        const row = c.overheadRows.find(r => r.id === o.id);
        return /*#__PURE__*/_jsxDEV("div", {
          style: {
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            flexWrap: "wrap",
            padding: "8px 0",
            borderBottom: `1px dashed ${T.line}`
          },
          children: [/*#__PURE__*/_jsxDEV(Field, {
            label: "Cost name",
            flex: "2 1 150px",
            children: /*#__PURE__*/_jsxDEV("input", {
              style: inputStyle,
              value: o.name,
              onChange: e => setItem({
                overheads: item.overheads.map(x => x.id === o.id ? {
                  ...x,
                  name: e.target.value
                } : x)
              }),
              placeholder: "e.g. Marketing, Labor share"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
            label: "Type",
            flex: "1 1 120px",
            children: /*#__PURE__*/_jsxDEV("select", {
              style: inputStyle,
              value: o.mode,
              onChange: e => setItem({
                overheads: item.overheads.map(x => x.id === o.id ? {
                  ...x,
                  mode: e.target.value
                } : x)
              }),
              children: [/*#__PURE__*/_jsxDEV("option", {
                value: "percent",
                children: "% of materials"
              }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
                value: "amount",
                children: "Fixed EGP"
              }, void 0, false)]
            }, void 0, true)
          }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
            label: o.mode === "percent" ? "%" : "EGP",
            flex: "1 1 90px",
            children: /*#__PURE__*/_jsxDEV("input", {
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
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            style: {
              fontSize: 13,
              color: T.inkSoft,
              paddingBottom: 10,
              minWidth: 90
            },
            children: ["= ", egp(row ? row.cost : 0)]
          }, void 0, true), /*#__PURE__*/_jsxDEV(Btn, {
            small: true,
            kind: "danger",
            onClick: () => setItem({
              overheads: item.overheads.filter(x => x.id !== o.id)
            }),
            children: "✕"
          }, void 0, false)]
        }, o.id, true);
      }), /*#__PURE__*/_jsxDEV("div", {
        style: {
          marginTop: 10
        },
        children: /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          onClick: () => setItem({
            overheads: [...(item.overheads || []), {
              id: uid(),
              name: "",
              mode: "percent",
              value: 0
            }]
          }),
          children: "+ Add cost line"
        }, void 0, false)
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 12,
          color: T.inkSoft,
          marginTop: 10
        },
        children: "\"% of materials\" lines apply to the materials subtotal (leather with waste + accessories). \"Fixed EGP\" lines add a flat amount — useful for labor share, marketing per piece, or packaging."
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Target revenue"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Revenue as",
          flex: "1 1 130px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: item.revenueMode,
            onChange: e => setItem({
              revenueMode: e.target.value
            }),
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "amount",
              children: "Amount (EGP)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "percent",
              children: "% of cost"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "hourly",
              children: "EGP per hour"
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: item.revenueMode === "percent" ? "Revenue %" : item.revenueMode === "hourly" ? "Rate (EGP/hour)" : "Revenue (EGP)",
          flex: "1 1 130px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: item.revenueValue,
            onChange: e => setItem({
              revenueValue: e.target.value
            })
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true), item.revenueMode === "hourly" && /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 12,
          color: num(item.hoursNeeded) > 0 ? T.inkSoft : T.danger,
          marginTop: 8,
          marginBottom: 0
        },
        children: num(item.hoursNeeded) > 0 ? `${num(item.revenueValue)} EGP/h × ${num(item.hoursNeeded)} h = ${egp(num(item.revenueValue) * num(item.hoursNeeded))} revenue` : "Set the manufacturing time in the Description & work time card above — revenue is rate × hours."
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
      style: {
        background: "#FBF5E8",
        border: `2px solid ${T.ink}`,
        borderRadius: 12,
        padding: "18px 20px",
        position: "relative",
        boxShadow: "4px 4px 0 rgba(44,31,18,0.25)"
      },
      children: [/*#__PURE__*/_jsxDEV("div", {
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
      }, void 0, false), /*#__PURE__*/_jsxDEV("h3", {
        style: {
          fontFamily: fontDisplay,
          margin: "0 0 12px",
          fontSize: 18,
          letterSpacing: 1,
          textTransform: "uppercase"
        },
        children: ["Cutting ticket — ", item.name]
      }, void 0, true), /*#__PURE__*/_jsxDEV(TicketRow, {
        label: `Leather (${ft(c.wasteFt)} incl. ${item.wastePct}% waste)`,
        value: egp(c.leatherCost)
      }, void 0, false), /*#__PURE__*/_jsxDEV(TicketRow, {
        label: "Accessories",
        value: egp(c.accCost)
      }, void 0, false), /*#__PURE__*/_jsxDEV(TicketRow, {
        label: "Materials subtotal",
        value: egp(c.subtotal),
        strong: true
      }, void 0, false), c.overheadRows.map(o => /*#__PURE__*/_jsxDEV(TicketRow, {
        label: `${o.name || "Unnamed cost"}${o.mode === "percent" ? ` (${num(o.value)}%)` : ""}`,
        value: egp(o.cost)
      }, o.id, false)), /*#__PURE__*/_jsxDEV(TicketRow, {
        label: "Total cost",
        value: egp(c.totalCost),
        strong: true
      }, void 0, false), /*#__PURE__*/_jsxDEV(TicketRow, {
        label: "Revenue",
        value: egp(c.revenue),
        accent: true
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          borderTop: `2px solid ${T.ink}`,
          marginTop: 10,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 8
        },
        children: [/*#__PURE__*/_jsxDEV("span", {
          style: {
            fontFamily: fontDisplay,
            fontSize: 16,
            fontWeight: 800
          },
          children: "Selling price"
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontFamily: fontDisplay,
            fontSize: 24,
            fontWeight: 800,
            color: T.accent
          },
          children: egp(c.sellingPrice)
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 18,
          marginTop: 8,
          fontSize: 13,
          color: T.inkSoft,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV("span", {
          children: ["Revenue = ", /*#__PURE__*/_jsxDEV("strong", {
            style: {
              color: T.ink
            },
            children: [c.markupPct.toFixed(1), "%"]
          }, void 0, true), " of total cost"]
        }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
          children: ["Profit margin = ", /*#__PURE__*/_jsxDEV("strong", {
            style: {
              color: T.ink
            },
            children: [c.marginPct.toFixed(1), "%"]
          }, void 0, true), " of selling price"]
        }, void 0, true)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        style: {
          marginTop: 14,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV(Btn, {
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
          },
          children: copied ? "Copied ✓" : "Copy customer quote"
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontSize: 12,
            color: T.inkSoft
          },
          children: "Name, description, and price — no costs revealed. Paste it straight into WhatsApp."
        }, void 0, false)]
      }, void 0, true), quoteFallback && /*#__PURE__*/_jsxDEV("textarea", {
        readOnly: true,
        value: quoteFallback,
        onFocus: e => e.target.select(),
        style: {
          ...inputStyle,
          marginTop: 8,
          height: 80,
          fontSize: 13
        }
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
}
function TicketRow({
  label,
  value,
  strong,
  accent
}) {
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: "5px 0",
      borderBottom: `1px dashed ${T.line}`,
      fontSize: strong ? 15 : 14,
      fontWeight: strong ? 700 : 400,
      color: accent ? T.accent : T.ink
    },
    children: [/*#__PURE__*/_jsxDEV("span", {
      children: label
    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
      style: {
        fontVariantNumeric: "tabular-nums"
      },
      children: value
    }, void 0, false)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 6
    },
    children: [!(mix || isMixed) && /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      },
      children: Object.entries(byLeather).map(([lid, arr]) => {
        const l = leathers.find(x => x.id === lid);
        if (!l) return null;
        const totalFt = arr.reduce((s, pn) => s + pn.ft, 0);
        const common = choices[arr[0].pieceId] || "";
        return /*#__PURE__*/_jsxDEV(Field, {
          label: `${l.name} color (${Math.round(totalFt * 100) / 100} ft²)`,
          flex: "1 1 170px",
          children: /*#__PURE__*/_jsxDEV("select", {
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
            },
            children: (l.colors || []).map(cc => /*#__PURE__*/_jsxDEV("option", {
              value: cc.id,
              children: [cc.name, " — ", num(cc.stockFt), " ft²"]
            }, cc.id, true))
          }, void 0, false)
        }, lid, false);
      })
    }, void 0, false), (mix || isMixed) && /*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      },
      children: pieces.map(pn => {
        const l = leathers.find(x => x.id === pn.leatherId);
        if (!l) return null;
        return /*#__PURE__*/_jsxDEV(Field, {
          label: `${pn.name} — ${l.name} (${Math.round(pn.ft * 100) / 100} ft²)`,
          flex: "1 1 170px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: {
              ...inputStyle,
              fontSize: 13,
              padding: "6px 8px"
            },
            value: choices[pn.pieceId] || "",
            onChange: e => onChange({
              ...choices,
              [pn.pieceId]: e.target.value
            }),
            children: (l.colors || []).map(cc => /*#__PURE__*/_jsxDEV("option", {
              value: cc.id,
              children: [cc.name, " — ", num(cc.stockFt), " ft²"]
            }, cc.id, true))
          }, void 0, false)
        }, pn.pieceId, false);
      })
    }, void 0, false), anyMixable && /*#__PURE__*/_jsxDEV("button", {
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
      },
      children: mix || isMixed ? "← One color per leather" : "Mix colors per piece →"
    }, void 0, false)]
  }, void 0, true);
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
    if (!oItem || !oName.trim()) return;
    const it = itemById(oItem);
    setOrders([...orders, {
      id: uid(),
      itemId: oItem,
      itemName: it ? it.name : "",
      customer: oName.trim(),
      mobile: oMobile.trim(),
      address: oAddress.trim(),
      notes: oNotes.trim(),
      deliveryDate: oDelivery,
      deposit: num(oDeposit),
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

  // Per-model summary
  const groups = {};
  sold.forEach(o => {
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
  const totalSold = sold.reduce((s, o) => s + num(o.soldPrice), 0);
  const dateStr = iso => iso ? new Date(iso).toLocaleDateString("en-GB") : "";
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      },
      children: [/*#__PURE__*/_jsxDEV(Btn, {
        small: true,
        kind: view === "active" ? "solid" : "outline",
        onClick: () => setView("active"),
        children: ["Active orders (", active.length, ")"]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Btn, {
        small: true,
        kind: view === "history" ? "solid" : "outline",
        onClick: () => setView("history"),
        children: ["History (", sold.length, ")"]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Btn, {
        small: true,
        kind: view === "customers" ? "solid" : "outline",
        onClick: () => setView("customers"),
        children: "Customers"
      }, void 0, false)]
    }, void 0, true), view === "active" && /*#__PURE__*/_jsxDEV(_Fragment, {
      children: [(() => {
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
        return /*#__PURE__*/_jsxDEV(Card, {
          children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
            children: "Shopping list (orders not yet cut)"
          }, void 0, false), leatherLines.map((ln, i) => /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: "5px 0",
              borderBottom: `1px dashed ${T.line}`,
              fontSize: 13,
              flexWrap: "wrap"
            },
            children: [/*#__PURE__*/_jsxDEV("span", {
              style: {
                fontWeight: 600
              },
              children: ln.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              style: {
                color: ln.buy > 0.004 ? T.danger : "#3F6E2A"
              },
              children: ["need ", Math.round(ln.need * 100) / 100, " ft² · have ", Math.round(ln.stock * 100) / 100, " ft²", ln.buy > 0.004 ? ` → buy ${Math.round(ln.buy * 100) / 100} ft² (~${egp(ln.buy * ln.price)})` : " ✓"]
            }, void 0, true)]
          }, i, true)), accLines.map((ln, i) => /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: "5px 0",
              borderBottom: `1px dashed ${T.line}`,
              fontSize: 13,
              flexWrap: "wrap"
            },
            children: [/*#__PURE__*/_jsxDEV("span", {
              style: {
                fontWeight: 600
              },
              children: ln.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              style: {
                color: ln.buy > 0 ? T.danger : "#3F6E2A"
              },
              children: ["need ", ln.qty, " · have ", ln.stock, ln.buy > 0 ? ` → buy ${ln.buy} (~${egp(ln.buy * ln.price)})` : " ✓"]
            }, void 0, true)]
          }, `a${i}`, true)), totalBuyCost > 0.004 && /*#__PURE__*/_jsxDEV("div", {
            style: {
              marginTop: 8,
              fontSize: 13
            },
            children: ["To buy: ", /*#__PURE__*/_jsxDEV("strong", {
              style: {
                color: T.accent
              },
              children: ["~", egp(totalBuyCost)]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true);
      })(), active.length > 0 && /*#__PURE__*/_jsxDEV(Card, {
        style: {
          padding: "10px 16px"
        },
        children: /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontSize: 14
          },
          children: ["Workload on the bench: ", /*#__PURE__*/_jsxDEV("strong", {
            style: {
              fontFamily: fontDisplay,
              color: T.accent
            },
            children: [totalHours, " hours"]
          }, void 0, true), " across ", active.length, " order", active.length > 1 ? "s" : "", totalHours === 0 && /*#__PURE__*/_jsxDEV("span", {
            style: {
              color: T.inkSoft
            },
            children: " — set manufacturing time on your items to see hours here"
          }, void 0, false)]
        }, void 0, true)
      }, void 0, false), /*#__PURE__*/_jsxDEV(Card, {
        children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
          children: "New order"
        }, void 0, false), data.items.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
          style: {
            fontSize: 14,
            color: T.inkSoft
          },
          children: "Create at least one item first — orders are placed against your items."
        }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
          style: {
            display: "grid",
            gap: 10
          },
          children: [/*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            },
            children: [/*#__PURE__*/_jsxDEV(Field, {
              label: "Item",
              flex: "2 1 180px",
              children: /*#__PURE__*/_jsxDEV("select", {
                style: inputStyle,
                value: oItem,
                onChange: e => {
                  setOItem(e.target.value);
                  setOColors({});
                },
                children: data.items.map(i => {
                  const p = computeItem(i, data.leathers, data.accessories).sellingPrice;
                  return /*#__PURE__*/_jsxDEV("option", {
                    value: i.id,
                    children: [i.name, " — ", Math.round(p), " EGP"]
                  }, i.id, true);
                })
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
              label: "Customer name",
              flex: "2 1 160px",
              children: /*#__PURE__*/_jsxDEV("input", {
                style: inputStyle,
                value: oName,
                onChange: e => setOName(e.target.value)
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
              label: "Mobile",
              flex: "1 1 130px",
              children: /*#__PURE__*/_jsxDEV("input", {
                style: inputStyle,
                type: "tel",
                value: oMobile,
                onChange: e => setOMobile(e.target.value)
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV(Field, {
            label: "Address",
            flex: "1 1 100%",
            children: /*#__PURE__*/_jsxDEV("input", {
              style: inputStyle,
              value: oAddress,
              onChange: e => setOAddress(e.target.value)
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            },
            children: [/*#__PURE__*/_jsxDEV(Field, {
              label: "Delivery date",
              flex: "1 1 150px",
              children: /*#__PURE__*/_jsxDEV("input", {
                style: inputStyle,
                type: "date",
                value: oDelivery,
                onChange: e => setODelivery(e.target.value)
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
              label: "Deposit paid (EGP)",
              flex: "1 1 150px",
              children: /*#__PURE__*/_jsxDEV("input", {
                style: inputStyle,
                type: "number",
                min: "0",
                value: oDeposit,
                onChange: e => setODeposit(e.target.value),
                placeholder: "0"
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true), oItem && itemById(oItem) && pieceNeedsList(itemById(oItem)).length > 0 && /*#__PURE__*/_jsxDEV(ColorChooser, {
            item: itemById(oItem),
            leathers: data.leathers,
            choices: resolveChoices(itemById(oItem), oColors),
            onChange: setOColors
          }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
            label: "Notes",
            flex: "1 1 100%",
            children: /*#__PURE__*/_jsxDEV("textarea", {
              style: {
                ...inputStyle,
                height: 60,
                resize: "vertical"
              },
              value: oNotes,
              onChange: e => setONotes(e.target.value),
              placeholder: "Color change, deadline, deposit paid…"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: /*#__PURE__*/_jsxDEV(Btn, {
              onClick: addOrder,
              children: "Add order"
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true), active.length === 0 && /*#__PURE__*/_jsxDEV(Card, {
        children: /*#__PURE__*/_jsxDEV("p", {
          style: {
            margin: 0,
            fontSize: 14,
            color: T.inkSoft
          },
          children: "No orders in progress."
        }, void 0, false)
      }, void 0, false), active.map(o => {
        const it = itemById(o.itemId);
        return /*#__PURE__*/_jsxDEV(Card, {
          children: /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-start"
            },
            children: [it && it.photo && /*#__PURE__*/_jsxDEV("img", {
              src: it.photo,
              alt: "",
              style: {
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: 8,
                border: `2px solid ${T.line}`
              }
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              style: {
                flex: "1 1 220px",
                display: "grid",
                gap: 4
              },
              children: [/*#__PURE__*/_jsxDEV("strong", {
                style: {
                  fontFamily: fontDisplay,
                  fontSize: 16
                },
                children: it && it.name || o.itemName
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 13
                },
                children: [o.customer, o.mobile ? ` · ${o.mobile}` : ""]
              }, void 0, true), o.address && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 13,
                  color: T.inkSoft
                },
                children: o.address
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: ["Ordered ", dateStr(o.createdAt), it && num(it.hoursNeeded) > 0 ? ` · ~${num(it.hoursNeeded)} h work` : ""]
              }, void 0, true), it && pieceNeedsList(it).length > 0 && (o.cutAt ? /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: Object.entries(aggregateByColor(it, resolveChoices(it, o.colorChoices))).map(([lid, colorMap]) => {
                  const l = leatherById(lid);
                  if (!l) return null;
                  const names = Object.keys(colorMap).map(cid => ((l.colors || []).find(cc => cc.id === cid) || {}).name || "?");
                  return `${l.name}: ${names.join(" + ")}`;
                }).filter(Boolean).join(" · ")
              }, void 0, false) : /*#__PURE__*/_jsxDEV(ColorChooser, {
                item: it,
                leathers: data.leathers,
                choices: resolveChoices(it, o.colorChoices),
                onChange: next => setOrders(orders.map(x => x.id === o.id ? {
                  ...x,
                  colorChoices: next
                } : x))
              }, void 0, false)), o.deliveryDate && (() => {
                const days = Math.ceil((new Date(o.deliveryDate) - new Date()) / 86400000);
                const late = days < 0;
                const soon = days >= 0 && days <= 3;
                return /*#__PURE__*/_jsxDEV("span", {
                  style: {
                    fontSize: 12,
                    fontWeight: 700,
                    color: late ? "#fff" : soon ? "#7A4A00" : T.inkSoft,
                    background: late ? T.danger : soon ? "#F5DFA8" : "transparent",
                    border: late || soon ? `1.5px solid ${late ? T.danger : "#C79A3B"}` : "none",
                    borderRadius: 6,
                    padding: late || soon ? "3px 8px" : 0,
                    justifySelf: "start"
                  },
                  children: ["Delivery ", dateStr(o.deliveryDate + "T00:00:00"), " ", late ? `— ${-days} day${days < -1 ? "s" : ""} overdue!` : days === 0 ? "— today!" : `— in ${days} day${days > 1 ? "s" : ""}`]
                }, void 0, true);
              })(), /*#__PURE__*/_jsxDEV("div", {
                style: {
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 2
                },
                children: [/*#__PURE__*/_jsxDEV(Field, {
                  label: "Delivery",
                  flex: "0 1 140px",
                  children: /*#__PURE__*/_jsxDEV("input", {
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
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
                  label: "Deposit (EGP)",
                  flex: "0 1 110px",
                  children: /*#__PURE__*/_jsxDEV("input", {
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
                  }, void 0, false)
                }, void 0, false), num(o.deposit) > 0 && it && /*#__PURE__*/_jsxDEV("span", {
                  style: {
                    fontSize: 12,
                    color: T.inkSoft,
                    alignSelf: "flex-end",
                    paddingBottom: 9
                  },
                  children: ["Balance due: ", /*#__PURE__*/_jsxDEV("strong", {
                    style: {
                      color: T.ink
                    },
                    children: egp(Math.max(0, computeItem(it, data.leathers, data.accessories).sellingPrice - num(o.deposit)))
                  }, void 0, false)]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("textarea", {
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
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              style: {
                display: "grid",
                gap: 8,
                justifyItems: "stretch"
              },
              children: [/*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7A4A00",
                  background: "#F5DFA8",
                  border: "1.5px solid #C79A3B",
                  borderRadius: 6,
                  padding: "4px 8px",
                  textAlign: "center"
                },
                children: "In progress"
              }, void 0, false), it && Object.keys(leatherNeedsFt(it)).length > 0 && (o.cutAt ? /*#__PURE__*/_jsxDEV(_Fragment, {
                children: [/*#__PURE__*/_jsxDEV("span", {
                  style: {
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#3F6E2A",
                    border: "1.5px solid #3F6E2A",
                    borderRadius: 6,
                    padding: "4px 8px",
                    textAlign: "center"
                  },
                  children: "Leather cut ✓"
                }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
                  small: true,
                  kind: "outline",
                  onClick: () => uncutOrder(o),
                  children: "Undo cut"
                }, void 0, false)]
              }, void 0, true) : (() => {
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
                return /*#__PURE__*/_jsxDEV(_Fragment, {
                  children: [/*#__PURE__*/_jsxDEV(Btn, {
                    small: true,
                    kind: "outline",
                    onClick: () => cutOrder(o),
                    children: "✂ Cut leather"
                  }, void 0, false), shortCount > 0 && /*#__PURE__*/_jsxDEV("span", {
                    style: {
                      fontSize: 11,
                      color: T.danger,
                      textAlign: "center"
                    },
                    children: "Not enough stock (leather color or accessories)!"
                  }, void 0, false)]
                }, void 0, true);
              })()), sellId === o.id ? /*#__PURE__*/_jsxDEV("div", {
                style: {
                  display: "grid",
                  gap: 6
                },
                children: [/*#__PURE__*/_jsxDEV(Field, {
                  label: "Sold price (EGP)",
                  children: /*#__PURE__*/_jsxDEV("input", {
                    style: inputStyle,
                    type: "number",
                    min: "0",
                    value: sellPrice,
                    onChange: e => setSellPrice(e.target.value)
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
                  small: true,
                  onClick: () => confirmSell(o),
                  children: "Confirm sale"
                }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
                  small: true,
                  kind: "outline",
                  onClick: () => setSellId(null),
                  children: "Cancel"
                }, void 0, false)]
              }, void 0, true) : /*#__PURE__*/_jsxDEV(Btn, {
                small: true,
                onClick: () => startSell(o),
                children: "Mark as sold"
              }, void 0, false), /*#__PURE__*/_jsxDEV(ConfirmBtn, {
                small: true,
                onConfirm: () => setOrders(orders.filter(x => x.id !== o.id)),
                children: "Delete"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true)
        }, o.id, false);
      })]
    }, void 0, true), view === "history" && /*#__PURE__*/_jsxDEV(_Fragment, {
      children: [/*#__PURE__*/_jsxDEV(Card, {
        children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
          children: "Sales by model"
        }, void 0, false), summary.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
          style: {
            margin: 0,
            fontSize: 14,
            color: T.inkSoft
          },
          children: "Nothing sold yet — completed orders will appear here."
        }, void 0, false) : /*#__PURE__*/_jsxDEV(_Fragment, {
          children: [summary.map(g => /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: "6px 0",
              borderBottom: `1px dashed ${T.line}`,
              fontSize: 14
            },
            children: [/*#__PURE__*/_jsxDEV("span", {
              style: {
                fontWeight: 600
              },
              children: g.name
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              style: {
                color: T.inkSoft
              },
              children: [g.count, " sold · ", egp(g.total)]
            }, void 0, true)]
          }, g.name, true)), /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 10,
              fontWeight: 700,
              fontSize: 15
            },
            children: [/*#__PURE__*/_jsxDEV("span", {
              children: "Total"
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              style: {
                color: T.accent
              },
              children: [sold.length, " items · ", egp(totalSold)]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true), sold.map(o => {
        const it = itemById(o.itemId);
        const discount = num(o.listPrice) - num(o.soldPrice);
        return /*#__PURE__*/_jsxDEV(Card, {
          children: /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center"
            },
            children: [it && it.photo && /*#__PURE__*/_jsxDEV("img", {
              src: it.photo,
              alt: "",
              style: {
                width: 52,
                height: 52,
                objectFit: "cover",
                borderRadius: 8,
                border: `2px solid ${T.line}`
              }
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              style: {
                flex: "1 1 200px",
                display: "grid",
                gap: 2
              },
              children: [/*#__PURE__*/_jsxDEV("strong", {
                style: {
                  fontFamily: fontDisplay,
                  fontSize: 15
                },
                children: it && it.name || o.itemName
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 13
                },
                children: [o.customer, o.mobile ? ` · ${o.mobile}` : ""]
              }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: ["Sold ", dateStr(o.soldAt)]
              }, void 0, true), o.notes && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: o.notes
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              style: {
                display: "grid",
                gap: 4,
                textAlign: "right"
              },
              children: [/*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontFamily: fontDisplay,
                  fontWeight: 800,
                  fontSize: 17,
                  color: T.accent
                },
                children: egp(num(o.soldPrice))
              }, void 0, false), discount > 0.5 && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.danger
                },
                children: ["−", egp(discount), " off list (", egp(num(o.listPrice)), ")"]
              }, void 0, true), num(o.deposit) > 0 && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: ["Deposit ", egp(num(o.deposit)), " · rest ", egp(Math.max(0, num(o.soldPrice) - num(o.deposit)))]
              }, void 0, true), /*#__PURE__*/_jsxDEV(Btn, {
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
                }),
                children: "Undo sale"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true)
        }, o.id, false);
      })]
    }, void 0, true), view === "customers" && (() => {
      const groups = {};
      orders.forEach(o => {
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
      return /*#__PURE__*/_jsxDEV(_Fragment, {
        children: [list.length === 0 && /*#__PURE__*/_jsxDEV(Card, {
          children: /*#__PURE__*/_jsxDEV("p", {
            style: {
              margin: 0,
              fontSize: 14,
              color: T.inkSoft
            },
            children: "No customers yet — they'll appear here as you take orders."
          }, void 0, false)
        }, void 0, false), list.map((g, i) => /*#__PURE__*/_jsxDEV(Card, {
          children: /*#__PURE__*/_jsxDEV("div", {
            style: {
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center"
            },
            children: [/*#__PURE__*/_jsxDEV("div", {
              style: {
                flex: "1 1 200px",
                display: "grid",
                gap: 3
              },
              children: [/*#__PURE__*/_jsxDEV("strong", {
                style: {
                  fontFamily: fontDisplay,
                  fontSize: 16
                },
                children: g.name
              }, void 0, false), g.mobile && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 13
                },
                children: g.mobile
              }, void 0, false), g.items.length > 0 && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: ["Bought: ", g.items.join(", ")]
              }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: ["Last order ", dateStr(g.lastDate)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              style: {
                display: "grid",
                gap: 3,
                textAlign: "right"
              },
              children: [/*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontFamily: fontDisplay,
                  fontWeight: 800,
                  fontSize: 17,
                  color: T.accent
                },
                children: egp(g.total)
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 12,
                  color: T.inkSoft
                },
                children: [g.soldCount, " bought", g.activeCount > 0 ? ` · ${g.activeCount} in progress` : ""]
              }, void 0, true), g.soldCount >= 2 && /*#__PURE__*/_jsxDEV("span", {
                style: {
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3F6E2A",
                  border: "1.5px solid #3F6E2A",
                  borderRadius: 6,
                  padding: "2px 6px",
                  justifySelf: "end"
                },
                children: "★ Repeat customer"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true)
        }, i, false))]
      }, void 0, true);
    })()]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))",
        gap: 10
      },
      children: cats.map(c => {
        const b = balance(c);
        const isProfit = c.toLowerCase() === "profit";
        return /*#__PURE__*/_jsxDEV(Card, {
          style: {
            padding: 12,
            ...(isProfit ? {
              borderStyle: "solid",
              borderColor: T.accent
            } : {})
          },
          children: [/*#__PURE__*/_jsxDEV("div", {
            style: {
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: T.inkSoft
            },
            children: c
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            style: {
              fontFamily: fontDisplay,
              fontWeight: 800,
              fontSize: 18,
              marginTop: 4,
              color: b < -0.004 ? T.danger : isProfit ? T.accent : T.ink
            },
            children: egp(b)
          }, void 0, false)]
        }, c, true);
      })
    }, void 0, false), /*#__PURE__*/_jsxDEV(Card, {
      style: {
        padding: "10px 16px"
      },
      children: /*#__PURE__*/_jsxDEV("span", {
        style: {
          fontSize: 14
        },
        children: ["Total across all budgets: ", /*#__PURE__*/_jsxDEV("strong", {
          style: {
            fontFamily: fontDisplay,
            color: totalBalance < 0 ? T.danger : T.accent
          },
          children: egp(totalBalance)
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Record a transaction"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end"
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Type",
          flex: "1 1 130px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: pType,
            onChange: e => setPType(e.target.value),
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "purchase",
              children: "Purchase (take out)"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "deposit",
              children: "Add money (put in)"
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Budget",
          flex: "1 1 140px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: pCat,
            onChange: e => setPCat(e.target.value),
            children: cats.map(c => /*#__PURE__*/_jsxDEV("option", {
              value: c,
              children: c
            }, c, false))
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Amount (EGP)",
          flex: "1 1 110px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: pAmt,
            onChange: e => setPAmt(e.target.value)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Note",
          flex: "2 1 180px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            value: pNote,
            onChange: e => setPNote(e.target.value),
            placeholder: "e.g. Bought 12 ft² crazy horse"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          onClick: addTx,
          children: "Record"
        }, void 0, false)]
      }, void 0, true), isLeatherPurchase && data.leathers.length > 0 && /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${T.line}`
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Add to stock (optional)",
          flex: "2 1 160px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: pLeather,
            onChange: e => {
              setPLeather(e.target.value);
              setPColor("");
            },
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "",
              children: "— Don't update stock —"
            }, void 0, false), data.leathers.map(l => /*#__PURE__*/_jsxDEV("option", {
              value: l.id,
              children: l.name
            }, l.id, false))]
          }, void 0, true)
        }, void 0, false), selLeather && /*#__PURE__*/_jsxDEV(_Fragment, {
          children: [/*#__PURE__*/_jsxDEV(Field, {
            label: "Color",
            flex: "1 1 130px",
            children: /*#__PURE__*/_jsxDEV("select", {
              style: inputStyle,
              value: pColor,
              onChange: e => setPColor(e.target.value),
              children: [/*#__PURE__*/_jsxDEV("option", {
                value: "",
                children: "Choose color"
              }, void 0, false), (selLeather.colors || []).map(cc => /*#__PURE__*/_jsxDEV("option", {
                value: cc.id,
                children: cc.name
              }, cc.id, false))]
            }, void 0, true)
          }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
            label: "ft² bought",
            flex: "0 1 100px",
            children: /*#__PURE__*/_jsxDEV("input", {
              style: inputStyle,
              type: "number",
              min: "0",
              step: "0.1",
              value: pFt,
              onChange: e => setPFt(e.target.value)
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true), isAccPurchase && data.accessories.length > 0 && /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginTop: 10,
          paddingTop: 10,
          borderTop: `1px dashed ${T.line}`
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Add to stock (optional)",
          flex: "2 1 160px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: pAccId,
            onChange: e => setPAccId(e.target.value),
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "",
              children: "— Don't update stock —"
            }, void 0, false), data.accessories.map(a => /*#__PURE__*/_jsxDEV("option", {
              value: a.id,
              children: a.name
            }, a.id, false))]
          }, void 0, true)
        }, void 0, false), selAcc && /*#__PURE__*/_jsxDEV(Field, {
          label: "Quantity bought",
          flex: "0 1 120px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: pAccQty,
            onChange: e => setPAccQty(e.target.value)
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 12,
          color: T.inkSoft,
          marginTop: 10
        },
        children: "Sales fill these budgets automatically when you mark an order as sold. Use this form for real-world purchases (leather, hardware, ads, tools) or to add your own money to a budget."
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
          children: "Transactions"
        }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
          style: {
            ...inputStyle,
            width: "auto"
          },
          value: filter,
          onChange: e => setFilter(e.target.value),
          children: [/*#__PURE__*/_jsxDEV("option", {
            value: "all",
            children: "All budgets"
          }, void 0, false), cats.map(c => /*#__PURE__*/_jsxDEV("option", {
            value: c,
            children: c
          }, c, false))]
        }, void 0, true)]
      }, void 0, true), shown.length === 0 && /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 14,
          color: T.inkSoft
        },
        children: "No transactions yet. Sell an item or record a purchase to get started."
      }, void 0, false), shown.map(t => /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "8px 0",
          borderBottom: `1px dashed ${T.line}`,
          fontSize: 13,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsxDEV("span", {
          style: {
            color: T.inkSoft,
            flex: "0 0 74px"
          },
          children: dateStr(t.date)
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            flex: "0 0 100px",
            fontWeight: 700
          },
          children: t.category
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            flex: "1 1 160px",
            color: T.inkSoft
          },
          children: t.note || (t.type === "sale" ? "Sale allocation" : "")
        }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: num(t.amount) < 0 ? T.danger : "#3F6E2A"
          },
          children: [num(t.amount) >= 0 ? "+" : "", egp(num(t.amount))]
        }, void 0, true), t.type !== "sale" ? /*#__PURE__*/_jsxDEV(ConfirmBtn, {
          small: true,
          onConfirm: () => update({
            budgetTx: tx.filter(x => x.id !== t.id)
          }),
          children: "✕"
        }, void 0, false) : /*#__PURE__*/_jsxDEV("span", {
          style: {
            fontSize: 11,
            color: T.inkSoft
          },
          children: "auto"
        }, void 0, false)]
      }, t.id, true)), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 12,
          color: T.inkSoft,
          marginTop: 10
        },
        children: "Entries marked \"auto\" come from sales — to remove one, use \"Undo sale\" on that order in the Orders history."
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
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
  return /*#__PURE__*/_jsxDEV("div", {
    style: {
      display: "grid",
      gap: 16
    },
    children: [/*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Default cost lines for new items"
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 13,
          color: T.inkSoft,
          marginTop: 0
        },
        children: "Every new item starts with these lines already filled in. Existing items are not affected."
      }, void 0, false), (settings.defaultOverheads || []).map(o => /*#__PURE__*/_jsxDEV("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          flexWrap: "wrap",
          padding: "8px 0",
          borderBottom: `1px dashed ${T.line}`
        },
        children: [/*#__PURE__*/_jsxDEV(Field, {
          label: "Cost name",
          flex: "2 1 150px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            value: o.name,
            onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
              ...x,
              name: e.target.value
            } : x)),
            placeholder: "e.g. Marketing"
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: "Type",
          flex: "1 1 120px",
          children: /*#__PURE__*/_jsxDEV("select", {
            style: inputStyle,
            value: o.mode,
            onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
              ...x,
              mode: e.target.value
            } : x)),
            children: [/*#__PURE__*/_jsxDEV("option", {
              value: "percent",
              children: "% of materials"
            }, void 0, false), /*#__PURE__*/_jsxDEV("option", {
              value: "amount",
              children: "Fixed EGP"
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Field, {
          label: o.mode === "percent" ? "%" : "EGP",
          flex: "1 1 90px",
          children: /*#__PURE__*/_jsxDEV("input", {
            style: inputStyle,
            type: "number",
            min: "0",
            value: o.value,
            onChange: e => setDefaults(settings.defaultOverheads.map(x => x.id === o.id ? {
              ...x,
              value: e.target.value
            } : x))
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          kind: "danger",
          onClick: () => setDefaults(settings.defaultOverheads.filter(x => x.id !== o.id)),
          children: "✕"
        }, void 0, false)]
      }, o.id, true)), /*#__PURE__*/_jsxDEV("div", {
        style: {
          marginTop: 10
        },
        children: /*#__PURE__*/_jsxDEV(Btn, {
          small: true,
          onClick: () => setDefaults([...(settings.defaultOverheads || []), {
            id: uid(),
            name: "",
            mode: "percent",
            value: 0
          }]),
          children: "+ Add default line"
        }, void 0, false)
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Backup"
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 13,
          color: T.inkSoft,
          marginTop: 0
        },
        children: "Download a backup file — leathers, accessories, items, photos, orders, and budgets. Save it to Google Drive, email it to yourself, or move it to another phone or your PC."
      }, void 0, false), /*#__PURE__*/_jsxDEV(Btn, {
        small: true,
        onClick: downloadBackup,
        children: "⬇ Download backup file"
      }, void 0, false), /*#__PURE__*/_jsxDEV("details", {
        style: {
          marginTop: 14
        },
        children: [/*#__PURE__*/_jsxDEV("summary", {
          style: {
            cursor: "pointer",
            fontSize: 13,
            color: T.inkSoft
          },
          children: "Or copy as text (for pasting into an email)"
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          style: {
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 10
          },
          children: [/*#__PURE__*/_jsxDEV(Btn, {
            small: true,
            kind: "outline",
            onClick: makeBackup,
            children: "Create text backup"
          }, void 0, false), backupText && /*#__PURE__*/_jsxDEV(Btn, {
            small: true,
            kind: "outline",
            onClick: copyBackup,
            children: copied ? "Copied ✓" : "Copy backup text"
          }, void 0, false)]
        }, void 0, true), backupText && /*#__PURE__*/_jsxDEV("textarea", {
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
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      children: [/*#__PURE__*/_jsxDEV(SectionTitle, {
        children: "Restore from backup"
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        style: {
          fontSize: 13,
          color: T.inkSoft,
          marginTop: 0
        },
        children: "Choose a backup file to restore. This replaces everything currently in the app."
      }, void 0, false), /*#__PURE__*/_jsxDEV("label", {
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
        },
        children: ["Choose backup file…", /*#__PURE__*/_jsxDEV("input", {
          type: "file",
          accept: "application/json,.json",
          onChange: restoreFromFile,
          style: {
            display: "none"
          }
        }, void 0, false)]
      }, void 0, true), restoreMsg && /*#__PURE__*/_jsxDEV("div", {
        style: {
          fontSize: 13,
          color: T.inkSoft,
          marginTop: 8
        },
        children: restoreMsg
      }, void 0, false), /*#__PURE__*/_jsxDEV("details", {
        style: {
          marginTop: 14
        },
        children: [/*#__PURE__*/_jsxDEV("summary", {
          style: {
            cursor: "pointer",
            fontSize: 13,
            color: T.inkSoft
          },
          children: "Or paste backup text instead"
        }, void 0, false), /*#__PURE__*/_jsxDEV("textarea", {
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
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          style: {
            marginTop: 8,
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap"
          },
          children: /*#__PURE__*/_jsxDEV(ConfirmBtn, {
            small: true,
            onConfirm: restore,
            confirmLabel: "Tap again — replaces ALL data",
            children: "Restore from text"
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true)]
  }, void 0, true);
}
