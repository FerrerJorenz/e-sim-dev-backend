export const regionMapping = {
  EU: {
    name: "Europe",
    currency_code: "eur",
    countries: [
      "al", "ad", "am", "at", "az", "by", "be", "ba", "bg", "hr", "cy", "cz", "dk", "ee", "fi", "fr",
      "ge", "de", "gr", "hu", "is", "ie", "it", "kz", "xk", "lv", "li", "lt", "lu", "mt", "md", "mc",
      "me", "nl", "mk", "no", "pl", "pt", "ro", "ru", "sm", "rs", "sk", "si", "es", "se", "ch", "tr",
      "ua", "gb", "va"
    ],
    coverage_codes: ["EU", "EUR", "EURO", "EEA", "EFTA"]
  },
  AS: {
    name: "Asia",
    currency_code: "usd",
    countries: [
      "af", "am", "az", "bh", "bd", "bt", "bn", "kh", "cn", "cy", "ge", "in", "id", "ir", "iq", "il", "jp",
      "jo", "kz", "kp", "kr", "kw", "kg", "la", "lb", "my", "mv", "mn", "mm", "np", "om", "pk", "ph", "qa",
      "sa", "sg", "lk", "sy", "tw", "tj", "th", "tl", "tm", "ae", "uz", "vn", "ye"
    ],
    coverage_codes: ["AS", "ASIA", "APAC", "SEA", "EASTASIA", "SOUTHASIA", "CN", "IN", "JP", "KR", "SG"]
  },
  NA: {
    name: "North America",
    currency_code: "usd",
    countries: ["us", "ca", "mx", "gl", "bm"],
    coverage_codes: ["NA", "NAM", "US", "USA", "CA", "CAN", "MX", "MEX"]
  },
  SA: {
    name: "South America",
    currency_code: "usd",
    countries: ["ar", "bo", "br", "cl", "co", "ec", "gy", "py", "pe", "sr", "uy", "ve", "fk"],
    coverage_codes: ["SA", "SAM", "LATAM", "LATINAMERICA", "BR", "AR", "CL", "CO"]
  },
  AF: {
    name: "Africa",
    currency_code: "usd",
    countries: [
      "dz", "ao", "bj", "bw", "bf", "bi", "cv", "cm", "cf", "td", "km", "cg", "cd", "ci", "dj", "eg", "gq",
      "er", "sz", "et", "ga", "gm", "gh", "gn", "gw", "ke", "ls", "lr", "ly", "mg", "mw", "ml", "mr", "mu",
      "yt", "ma", "mz", "na", "ne", "ng", "rw", "re", "st", "sn", "sc", "sl", "so", "za", "ss", "sd", "tz",
      "tg", "tn", "ug", "zm", "zw"
    ],
    coverage_codes: ["AF", "AFRICA", "SSA", "NORTHAFRICA", "SOUTHAFRICA", "NAFRICA", "SAFRICA", "NG", "ZA"]
  },
  OC: {
    name: "Oceania",
    currency_code: "aud",
    countries: ["au", "nz", "fj", "pg", "ws", "sb", "to", "tv", "vu", "nr", "ki", "fm", "mh", "pw"],
    coverage_codes: ["OC", "OCEANIA", "AU", "NZ", "PACIFIC", "APAC"]
  },
  ME: {
    name: "Middle East",
    currency_code: "usd",
    countries: [
      "ae", "bh", "cy", "eg", "ir", "iq", "il", "jo", "kw", "lb", "om", "ps", "qa", "sa", "sy", "tr", "ye"
    ],
    coverage_codes: ["ME", "MIDEAST", "MIDDLEEAST", "UAE", "KSA", "QATAR", "GULF", "GCC", "LEVANT"]
  }
};
