const SPEC_STEP_ORDER = {
  "in": 1,
  "cán": 2,
  "cán bóng": 2,
  "cán mờ": 2,
  "cán màng": 2,
  "bồi": 3,
  "ép kim": 4,
  "ép": 4,
  "zipper": 5,
  "chạy zip": 5,
  "ép biên": 6,
  "xếp hông": 7,
  "xả cuộn": 8,
  "chia cuộn": 8,
  "cắt": 9,
  "bế": 10,
  "gỡ": 11,
  "ép miệng": 12,
  "dán": 13,
  "dán thành phẩm": 13,
  "chạy thành phẩm": 14,
};

function sortSpecificationSteps(steps, flowCode) {
  const result = Array.from(new Set(steps)).filter(Boolean);
  return result.sort((a, b) => {
    const orderA = SPEC_STEP_ORDER[a.trim().toLowerCase()] ?? 99;
    const orderB = SPEC_STEP_ORDER[b.trim().toLowerCase()] ?? 99;
    return orderA - orderB;
  });
}

console.log("4643 (PE Bag):", sortSpecificationSteps(["In", "Cán mờ", "Zipper", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"]));
console.log("4642 (Paper Bag):", sortSpecificationSteps(["In", "Cán bóng", "Cắt", "Bế", "Gỡ", "Dán"]));
console.log("4641 (Duplex Box):", sortSpecificationSteps(["In", "Cán bóng", "Bế", "Gỡ", "Dán"]));
console.log("4640 (Metaline Box):", sortSpecificationSteps(["In", "Cán bóng", "Bế", "Gỡ", "Dán"]));
console.log("4637 (Decal):", sortSpecificationSteps(["In", "Cán bóng", "Cắt", "Bế", "Gỡ"]));
console.log("4631 (Duplex Box no lam):", sortSpecificationSteps(["In", "Bế", "Gỡ", "Dán"]));
