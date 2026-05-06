# CrosshairBase — Upgrade Editor ให้รองรับเป้าทุกแบบเหมือน VCRDB

## เป้าหมาย
ตอนนี้ editor สร้างได้แค่เป้ากากบาทมาตรฐาน แต่เป้าแบบ Windmill, Glasses, Shuriken, Smiley, Reyna Flash, Flappy Bird ฯลฯ ของ VCRDB เกิดจากการตั้งค่า Valorant แบบสุดขอบ เลยอยากยกเครื่อง editor ให้ครอบคลุมทุกค่าของ Valorant จริง และเพิ่มระบบ Import/Export code

---

## 1. เพิ่ม Settings ที่ขาดทั้งหมด (Valorant มี 4 Tabs)

### Tab: General
- [ ] Crosshair Color (ปัจจุบันมีแล้ว แต่ขยายเป็น 8 สี + custom hex picker)
- [ ] Crosshair Color Code (hex input #00FF00)
- [ ] Outlines (On/Off)
- [ ] Outline Opacity (0–1, step 0.1)
- [ ] Outline Thickness (1–6)
- [ ] Center Dot (On/Off)
- [ ] Center Dot Opacity (0–1)
- [ ] Center Dot Thickness (1–6)
- [ ] Override Firing Error Offset With Crosshair Offset (On/Off)
- [ ] Override All Primary Crosshair With My Primary Crosshair (On/Off)

### Tab: Primary — Inner Lines
- [ ] Show Inner Lines (On/Off)
- [ ] Inner Line Opacity (0–1)
- [ ] Inner Line Length (0–20) **← พร้อม link 2 ค่า (เส้นแนวตั้ง/แนวนอน) แยกกันได้**
- [ ] Inner Line Thickness (0–10)
- [ ] **Inner Line Offset (0–20)** ← สำคัญมาก! ตัวนี้ทำให้เกิด Glasses, Flower
- [ ] Movement Error (On/Off)
- [ ] Movement Error Multiplier (0–3, step 0.1)
- [ ] Firing Error (On/Off)
- [ ] Firing Error Multiplier (0–3, step 0.1)

### Tab: Primary — Outer Lines
- [ ] Show Outer Lines (On/Off)
- [ ] Outer Line Opacity (0–1)
- [ ] Outer Line Length (0–20) — link 2 ค่าได้
- [ ] Outer Line Thickness (0–10)
- [ ] **Outer Line Offset (0–40)** ← สำคัญ ทำให้เกิด Shuriken, Windmill
- [ ] Movement Error (On/Off)
- [ ] Movement Error Multiplier (0–3)
- [ ] Firing Error (On/Off)
- [ ] Firing Error Multiplier (0–3)

### Tab: ADS (Aim Down Sight)
- [ ] Copy Primary Crosshair (On/Off)
- [ ] ทุกค่าซ้ำจาก Primary แต่เก็บแยก state

### Tab: Sniper
- [ ] Center Dot (On/Off)
- [ ] Center Dot Color
- [ ] Center Dot Opacity
- [ ] Center Dot Thickness

---

## 2. ยกเครื่อง Renderer (ส่วนที่วาดเป้า)

ตอนนี้ component ที่วาด crosshair ต้อง **เลิกใช้ template สำเร็จรูป** แล้ววาดจากค่าจริง:

```
สำหรับแต่ละทิศ (บน/ล่าง/ซ้าย/ขวา):
  วาดเส้น Inner Line ที่ตำแหน่ง:
    - เริ่มจาก center + InnerLineOffset
    - ความยาว = InnerLineLength
    - ความหนา = InnerLineThickness
    - ถ้า MovementError: ขยับออกไป × MovementErrorMultiplier
    - ถ้า FiringError: ขยับออกไป × FiringErrorMultiplier
  
  วาดเส้น Outer Line ที่ตำแหน่ง:
    - เริ่มจาก center + OuterLineOffset
    - (เหมือน Inner แต่ค่าของ Outer)
  
  วาด Outline รอบเส้นถ้าเปิด Outlines
  
  วาด Center Dot ตรงกลางถ้าเปิด
```

**สำคัญ:** ใช้ SVG หรือ Canvas วาดแบบ pixel-perfect (Valorant 1 unit = 1 pixel ที่ resolution มาตรฐาน)

---

## 3. ระบบ Import / Export Valorant Code

### Format ของ Valorant Crosshair Code
```
0;P;c;5;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0
```

แต่ละส่วนคั่นด้วย `;`:
- `0` = version
- `P` = Primary section
- `c;5` = color = 5 (Green)
- `h;0` = outlines off
- `0l;4` = inner line length = 4
- `0o;2` = inner line offset = 2
- `0a;1` = inner line opacity = 1
- `0f;0` = inner firing error off
- `1b;0` = outer line thickness = 0
- ฯลฯ

### Mapping ที่ต้องทำ
| Code | ค่า |
|------|-----|
| `c` | Color preset (0–8) |
| `u` | Custom color hex |
| `h` | Outlines on/off |
| `o` | Outline opacity |
| `t` | Outline thickness |
| `d` | Center dot on/off |
| `b` | Center dot opacity |
| `z` | Center dot thickness |
| `0b` | Inner lines on/off |
| `0t` | Inner thickness |
| `0l` | Inner length |
| `0v` | Inner length 2 (vertical) |
| `0o` | Inner offset |
| `0a` | Inner opacity |
| `0m` | Inner movement error |
| `0f` | Inner firing error |
| `0s` | Inner firing error multiplier |
| `0e` | Inner movement error multiplier |
| `1b` | Outer lines on/off |
| `1t` | Outer thickness |
| `1l` | Outer length |
| `1v` | Outer length 2 |
| `1o` | Outer offset |
| `1a` | Outer opacity |
| `1m` | Outer movement error |
| `1f` | Outer firing error |
| `S` | Sniper section |
| `A` | ADS section |
| `P` | Primary section |

### Functions ที่ต้องสร้าง
- `parseCrosshairCode(code: string): CrosshairSettings` — แปลง code → state
- `generateCrosshairCode(settings: CrosshairSettings): string` — แปลง state → code
- ปุ่ม **"Paste"** เพื่อวาง code → auto-fill ทุก slider
- ปุ่ม **"Copy Code"** ที่ generate code ตาม state ปัจจุบัน

---

## 4. UI ที่ต้องเพิ่ม

- [ ] **4 Tabs** (General / Primary / ADS / Sniper) ด้านบนของ panel การตั้งค่า
- [ ] **Section headers** ใน Primary: "Inner Lines", "Outer Lines"
- [ ] **Slider component** ที่แสดงค่าตัวเลขข้างๆ + รองรับการ link 2 ค่า (สำหรับ Length)
- [ ] **Toggle switch** (On/Off) ที่ดูสะอาด
- [ ] **Color picker** แบบ dropdown 8 สี + custom hex input
- [ ] ปุ่ม **Copy Code** / **Share Link** / **Paste** / **Randomize** ด้านล่าง panel

---

## 5. State Structure ที่แนะนำ

```typescript
type CrosshairSettings = {
  general: {
    color: number; // 0-8
    customColor?: string; // hex
    outlines: boolean;
    outlineOpacity: number;
    outlineThickness: number;
    centerDot: boolean;
    centerDotOpacity: number;
    centerDotThickness: number;
    overrideFiringErrorOffset: boolean;
    overrideAllPrimaryWithPrimary: boolean;
  };
  primary: {
    innerLines: LineSettings;
    outerLines: LineSettings;
  };
  ads: {
    copyPrimary: boolean;
    innerLines: LineSettings;
    outerLines: LineSettings;
  };
  sniper: {
    centerDot: boolean;
    centerDotColor: number;
    centerDotOpacity: number;
    centerDotThickness: number;
  };
};

type LineSettings = {
  show: boolean;
  opacity: number;
  length: number;
  length2?: number; // สำหรับ link 2 ค่า
  thickness: number;
  offset: number;
  movementError: boolean;
  movementErrorMultiplier: number;
  firingError: boolean;
  firingErrorMultiplier: number;
};
```

---

## 6. ตัวอย่างเป้าแปลกๆ ที่ต้องทำได้หลังอัปเกรด

ทดสอบว่าสร้างเป้าพวกนี้ได้ไหม:

| ชื่อเป้า | ค่าหลักที่ต้องตั้ง |
|--------|----------------|
| **Glasses** | Inner Length สั้นมาก (1-2) + Inner Offset สูง (15-20) |
| **Windmill** | Movement Error Multiplier สูง (2-3) + Length กลางๆ |
| **Shuriken** | Outer Offset สูง + Outer Length สั้น + Firing Error |
| **Smiley / Dot only** | ปิด Inner+Outer Lines + Center Dot Thickness สูง |
| **Flappy Bird** | Outer Lines + Length สั้น + Thickness สูง + Outer Offset น้อย |
| **Hollow Circle** | Center Dot Opacity ต่ำ + Outline หนา |
| **Star** | Inner Length สั้นมาก + Inner Offset 0 + Thickness ต่ำ |

---

## 7. ลำดับงานที่แนะนำ (Roadmap)

1. **Refactor State** — เปลี่ยน state เป็น structure ใหม่ตามด้านบน
2. **เขียน Renderer ใหม่** — รองรับ Offset + Error Multipliers
3. **อัปเดต Sliders + Toggles ทั้งหมดให้ครบ**
4. **เพิ่ม 4 Tabs UI**
5. **เขียน parser/generator ของ Valorant code**
6. **เพิ่มปุ่ม Paste/Copy/Share/Randomize**
7. **ทดสอบกับ code จริงจาก Valorant ว่าผลลัพธ์ตรงกัน**
8. **อัปเดต ~275 crosshair data ที่มีอยู่ให้ใช้ structure ใหม่**

---

## หมายเหตุ
- Stack ปัจจุบัน: Next.js 16.2.3 + React 19 + TypeScript + Tailwind CSS v4
- รักษา URL persistence + Favorites (localStorage) เดิมไว้
- ดูเอกสาร Next.js ใน `node_modules/next/dist/docs/` ก่อนเขียน เพราะเวอร์ชันใหม่มี breaking changes
