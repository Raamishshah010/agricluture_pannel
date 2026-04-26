const looksLikeArabicMojibake = (value) => /[\u00d8\u00d9][\u0080-\u00ff]/.test(value);

const decodeArabicMojibake = (value) => {
  if (typeof value !== "string" || !looksLikeArabicMojibake(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
};

const cleanName = (value) => {
  if (typeof value !== "string") {
    return value || "";
  }

  return decodeArabicMojibake(value).trim();
};

const firstAvailableName = (...values) => {
  for (const value of values) {
    const name = cleanName(value);
    if (name) return name;
  }
  return "";
};

export const getLocalizedPersonName = (person, language = "en") => {
  const profile = person?.uaePassProfile || {};
  const isArabic = String(language || "").toLowerCase().startsWith("ar");

  if (isArabic) {
    return firstAvailableName(
      profile.fullnameAR || [profile.firstnameAR, profile.lastnameAR].filter(Boolean).join(" "),
      person?.fullnameAR || [person?.firstnameAR, person?.lastnameAR].filter(Boolean).join(" "),
      person?.nameAr || person?.nameAR || person?.arabicName,
      person?.name,
      profile.fullnameEN || [profile.firstnameEN, profile.lastnameEN].filter(Boolean).join(" "),
    );
  }

  return firstAvailableName(
    profile.fullnameEN || [profile.firstnameEN, profile.lastnameEN].filter(Boolean).join(" "),
    person?.fullnameEN || [person?.firstnameEN, person?.lastnameEN].filter(Boolean).join(" "),
    person?.nameEn || person?.nameEN,
    person?.name,
    profile.fullnameAR || [profile.firstnameAR, profile.lastnameAR].filter(Boolean).join(" "),
  );
};
