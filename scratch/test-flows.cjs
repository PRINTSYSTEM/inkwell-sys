const FLOW_SPEC_STEPS_MAP = {
  F01: ["In", "Cán", "Bế", "Gỡ", "Dán"],
  F02: ["In", "Cán", "Bế", "Gỡ", "Dán"],
  F03: ["In", "Cán", "Bồi", "Bế", "Gỡ", "Dán"],
  F04: ["In", "Cán", "Bồi", "Bế", "Gỡ", "Dán"],
  F05: ["In", "Cán", "Cắt"],
  F06: ["In", "Cán", "Cắt", "Bế", "Gỡ", "Dán"],
  F07: ["In", "Cán", "Cắt"],
  F08: ["In", "Cán", "Cắt", "Bế", "Gỡ"],
  F09: ["In", "Cán", "Cắt", "Bế", "Gỡ"],
  F10: ["In", "Cán", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"],
  F11: ["In", "Cán", "Ép biên", "Xả cuộn", "Cắt", "Ép miệng"],
  F12: ["In", "Cán", "Xếp hông", "Cắt", "Ép miệng"],
  F13: ["In", "Cán", "Xếp hông", "Cắt", "Ép miệng"],
  F14: ["In", "Cán", "Zipper", "Ép biên", "Cắt"],
  F15: ["In", "Cán", "Chạy thành phẩm"],
  F16: ["In", "Cán", "Zipper", "Chạy thành phẩm"],
  F17: ["In", "Cán", "Bế", "Chia cuộn", "Cắt"],
  F18: ["In", "Cán", "Bế", "Chia cuộn", "Cắt"],
  F19: ["In", "Cán", "Cắt", "Bế", "Gỡ", "Dán"],
};

console.log("=== BẢNG THỐNG KÊ 19 PROD FLOWS & QUY CÁCH VẬT TƯ ===");
Object.entries(FLOW_SPEC_STEPS_MAP).forEach(([code, steps]) => {
  console.log(`${code}: [${steps.join(" -> ")}]`);
});
