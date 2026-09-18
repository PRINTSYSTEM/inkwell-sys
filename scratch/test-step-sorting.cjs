const SPEC_STEP_ORDER = {
  "in": 1,
  "cán bóng": 2,
  "cán mờ": 2,
  "cán màng": 2,
  "cán": 2,
  "bồi": 3,
  "ép": 4,
  "ép kim": 4,
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

function sortSteps(steps) {
  return [...steps].sort((a, b) => {
    const orderA = SPEC_STEP_ORDER[a.trim().toLowerCase()] ?? 99;
    const orderB = SPEC_STEP_ORDER[b.trim().toLowerCase()] ?? 99;
    return orderA - orderB;
  });
}

// Test cases from screenshot
console.log("4643 sorted:", sortSteps(["In", "Gỡ", "Dán", "Cán mờ", "Zipper", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"]));
console.log("4642 sorted:", sortSteps(["In", "Gỡ", "Dán", "Cán bóng", "Bế", "Cắt"]));
console.log("4641 sorted:", sortSteps(["In", "Bế", "Gỡ", "Dán", "Cán bóng"]));
