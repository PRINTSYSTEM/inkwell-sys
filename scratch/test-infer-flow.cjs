function inferFlowCode(target) {
  if (!target) return null;

  const rawFlowCode =
    target.flowCode ||
    target.productionFlowCode ||
    target.flow ||
    target.productionFlow?.code ||
    target.flow_code;

  if (typeof rawFlowCode === "string" && rawFlowCode.trim()) {
    return rawFlowCode.trim().toUpperCase();
  }

  const dtName = (target.designTypeName || target.designType?.name || "").toLowerCase();
  const matName = (target.materialTypeName || target.materialType?.name || "").toLowerCase();
  const notes = (target.notes || target.additionalNotes || "").toLowerCase();
  const pc = (target.processClassification || target.processClassificationOptionName || "").toLowerCase();

  const isZipper =
    target.isZipper ||
    target.hasZipper ||
    target.hasZip ||
    target.isZip ||
    notes.includes("zipper") ||
    notes.includes("zip");

  const isGusseted =
    target.gusseted ||
    target.isGusset ||
    target.isGusseted ||
    notes.includes("xếp hông");

  const isRoll = dtName.includes("cuộn") || matName.includes("cuộn");
  const isDecal = dtName.includes("decal") || matName.includes("decal") || dtName.includes("nhãn") || matName.includes("nhãn");
  const isBox = dtName.includes("hộp") || dtName.includes("hop");
  const isBag = dtName.includes("túi") || dtName.includes("tui");

  const isFlute = matName.includes("sóng") || matName.includes("song") || matName.includes("bồi") || matName.includes("boi") || matName.includes("carton");
  const isFilm = matName.includes("pe") || matName.includes("pp") || matName.includes("pet") || matName.includes("màng") || matName.includes("mang");

  // Plastic Film Bags / Rolls
  if (isBag && (isFilm || isZipper || isGusseted)) {
    if (isZipper) return "F14";
    if (isGusseted) return "F12";
    return "F10";
  }

  if (isRoll) {
    if (isZipper) return "F16";
    if (isDecal) return "F17";
    return "F15";
  }

  // Decal / Labels
  if (isDecal) {
    if (pc === "die_cut" || pc.includes("bế")) return "F08";
    return "F07";
  }

  // Boxes
  if (isBox) {
    if (isFlute) return "F03";
    return "F01";
  }

  // Paper Bags
  if (isBag) {
    return "F01";
  }

  return "F01";
}

// Test cases
console.log("Test 1 (Carton Duplex bồi Sóng 230gsm):", inferFlowCode({ designTypeName: "Hộp", materialTypeName: "Carton Duplex bồi Sóng (230 gsm)" }));
console.log("Test 2 (Duplex 350gsm Box):", inferFlowCode({ designTypeName: "Hộp", materialTypeName: "Duplex 350gsm" }));
console.log("Test 3 (Decal 80gsm):", inferFlowCode({ designTypeName: "Decal", materialTypeName: "Giấy 80gsm", processClassification: "die_cut" }));
console.log("Test 4 (PE Bag Zipper):", inferFlowCode({ designTypeName: "Túi", materialTypeName: "PE", isZipper: true }));
