const CATEGORIES = [{
  "title": "Alphabet (A–Z)",
  "short": "Alphabet",
  "desc": "Mengenal dan mengucapkan huruf bahasa Inggris",
  "icon": "blocks",
  "color": "peach",
  "levels": [{
    "title": "Huruf A–F",
    "items": [{
      "en": "Apple",
      "id": "Apel",
      "pic": "🍎",
      "letter": "A"
    }, {
      "en": "Bear",
      "id": "Beruang",
      "pic": "🐻",
      "letter": "B"
    }, {
      "en": "Cat",
      "id": "Kucing",
      "pic": "🐈",
      "letter": "C"
    }, {
      "en": "Dog",
      "id": "Anjing",
      "pic": "🐕",
      "letter": "D"
    }, {
      "en": "Egg",
      "id": "Telur",
      "pic": "🥚",
      "letter": "E"
    }, {
      "en": "Fish",
      "id": "Ikan",
      "pic": "🐟",
      "letter": "F"
    }]
  }, {
    "title": "Huruf G–L",
    "items": [{
      "en": "Goat",
      "id": "Kambing",
      "pic": "🐐",
      "letter": "G"
    }, {
      "en": "Hat",
      "id": "Topi",
      "pic": "👒",
      "letter": "H"
    }, {
      "en": "Ice cream",
      "id": "Es krim",
      "pic": "🍦",
      "letter": "I"
    }, {
      "en": "Juice",
      "id": "Jus",
      "pic": "🧃",
      "letter": "J"
    }, {
      "en": "Kite",
      "id": "Layang-layang",
      "pic": "🪁",
      "letter": "K"
    }, {
      "en": "Lion",
      "id": "Singa",
      "pic": "🦁",
      "letter": "L"
    }]
  }, {
    "title": "Huruf M–R",
    "items": [{
      "en": "Moon",
      "id": "Bulan",
      "pic": "🌙",
      "letter": "M"
    }, {
      "en": "Nest",
      "id": "Sarang",
      "pic": "🪺",
      "letter": "N"
    }, {
      "en": "Orange",
      "id": "Jeruk",
      "pic": "🍊",
      "letter": "O"
    }, {
      "en": "Pencil",
      "id": "Pensil",
      "pic": "✏️",
      "letter": "P"
    }, {
      "en": "Queen",
      "id": "Ratu",
      "pic": "👸",
      "letter": "Q"
    }, {
      "en": "Rabbit",
      "id": "Kelinci",
      "pic": "🐇",
      "letter": "R"
    }]
  }, {
    "title": "Huruf S–Z",
    "items": [{
      "en": "Sun",
      "id": "Matahari",
      "pic": "☀️",
      "letter": "S"
    }, {
      "en": "Tree",
      "id": "Pohon",
      "pic": "🌳",
      "letter": "T"
    }, {
      "en": "Umbrella",
      "id": "Payung",
      "pic": "☂️",
      "letter": "U"
    }, {
      "en": "Violin",
      "id": "Biola",
      "pic": "🎻",
      "letter": "V"
    }, {
      "en": "Whale",
      "id": "Paus",
      "pic": "🐳",
      "letter": "W"
    }, {
      "en": "Xylophone",
      "id": "Xilofon",
      "pic": "🎵",
      "letter": "X"
    }, {
      "en": "Yo-yo",
      "id": "Yoyo",
      "pic": "🪀",
      "letter": "Y"
    }, {
      "en": "Zebra",
      "id": "Zebra",
      "pic": "🦓",
      "letter": "Z"
    }]
  }, {
    "title": "Jelajah A–Z",
    "items": [{
      "en": "Apple",
      "id": "Apel",
      "pic": "🍎",
      "letter": "A"
    }, {
      "en": "Bear",
      "id": "Beruang",
      "pic": "🐻",
      "letter": "B"
    }, {
      "en": "Cat",
      "id": "Kucing",
      "pic": "🐈",
      "letter": "C"
    }, {
      "en": "Dog",
      "id": "Anjing",
      "pic": "🐕",
      "letter": "D"
    }, {
      "en": "Egg",
      "id": "Telur",
      "pic": "🥚",
      "letter": "E"
    }, {
      "en": "Fish",
      "id": "Ikan",
      "pic": "🐟",
      "letter": "F"
    }, {
      "en": "Goat",
      "id": "Kambing",
      "pic": "🐐",
      "letter": "G"
    }, {
      "en": "Hat",
      "id": "Topi",
      "pic": "👒",
      "letter": "H"
    }, {
      "en": "Ice cream",
      "id": "Es krim",
      "pic": "🍦",
      "letter": "I"
    }, {
      "en": "Juice",
      "id": "Jus",
      "pic": "🧃",
      "letter": "J"
    }, {
      "en": "Kite",
      "id": "Layang-layang",
      "pic": "🪁",
      "letter": "K"
    }, {
      "en": "Lion",
      "id": "Singa",
      "pic": "🦁",
      "letter": "L"
    }, {
      "en": "Moon",
      "id": "Bulan",
      "pic": "🌙",
      "letter": "M"
    }, {
      "en": "Nest",
      "id": "Sarang",
      "pic": "🪺",
      "letter": "N"
    }, {
      "en": "Orange",
      "id": "Jeruk",
      "pic": "🍊",
      "letter": "O"
    }, {
      "en": "Pencil",
      "id": "Pensil",
      "pic": "✏️",
      "letter": "P"
    }, {
      "en": "Queen",
      "id": "Ratu",
      "pic": "👸",
      "letter": "Q"
    }, {
      "en": "Rabbit",
      "id": "Kelinci",
      "pic": "🐇",
      "letter": "R"
    }, {
      "en": "Sun",
      "id": "Matahari",
      "pic": "☀️",
      "letter": "S"
    }, {
      "en": "Tree",
      "id": "Pohon",
      "pic": "🌳",
      "letter": "T"
    }, {
      "en": "Umbrella",
      "id": "Payung",
      "pic": "☂️",
      "letter": "U"
    }, {
      "en": "Violin",
      "id": "Biola",
      "pic": "🎻",
      "letter": "V"
    }, {
      "en": "Whale",
      "id": "Paus",
      "pic": "🐳",
      "letter": "W"
    }, {
      "en": "Xylophone",
      "id": "Xilofon",
      "pic": "🎵",
      "letter": "X"
    }, {
      "en": "Yo-yo",
      "id": "Yoyo",
      "pic": "🪀",
      "letter": "Y"
    }, {
      "en": "Zebra",
      "id": "Zebra",
      "pic": "🦓",
      "letter": "Z"
    }]
  }]
}, {
  "title": "Vocabulary (Kosakata)",
  "short": "Vocabulary",
  "desc": "Mempelajari dan melafalkan kata-kata sederhana",
  "icon": "apple",
  "color": "mint",
  "levels": [{
    "title": "Hewan",
    "items": [{
      "en": "Cat",
      "id": "Kucing",
      "pic": "🐈"
    }, {
      "en": "Dog",
      "id": "Anjing",
      "pic": "🐕"
    }, {
      "en": "Bear",
      "id": "Beruang",
      "pic": "🐻"
    }, {
      "en": "Fish",
      "id": "Ikan",
      "pic": "🐟"
    }]
  }, {
    "title": "Buah",
    "items": [{
      "en": "Apple",
      "id": "Apel",
      "pic": "🍎"
    }, {
      "en": "Banana",
      "id": "Pisang",
      "pic": "🍌"
    }, {
      "en": "Orange",
      "id": "Jeruk",
      "pic": "🍊"
    }, {
      "en": "Pear",
      "id": "Pir",
      "pic": "🍐"
    }]
  }, {
    "title": "Benda di sekolah",
    "items": [{
      "en": "Book",
      "id": "Buku",
      "pic": "📘"
    }, {
      "en": "Pencil",
      "id": "Pensil",
      "pic": "✏️"
    }, {
      "en": "Bag",
      "id": "Tas",
      "pic": "🎒"
    }, {
      "en": "Ruler",
      "id": "Penggaris",
      "pic": "📏"
    }]
  }, {
    "title": "Warna",
    "items": [{
      "en": "Red",
      "id": "Merah",
      "pic": "🔴"
    }, {
      "en": "Blue",
      "id": "Biru",
      "pic": "🔵"
    }, {
      "en": "Green",
      "id": "Hijau",
      "pic": "🟢"
    }, {
      "en": "Yellow",
      "id": "Kuning",
      "pic": "🟡"
    }]
  }, {
    "title": "Benda sehari-hari",
    "items": [{
      "en": "Cap",
      "id": "Topi",
      "pic": "🧢"
    }, {
      "en": "Key",
      "id": "Kunci",
      "pic": "🔑"
    }, {
      "en": "Clock",
      "id": "Jam",
      "pic": "🕒"
    }, {
      "en": "Bed",
      "id": "Tempat tidur",
      "pic": "🛏️"
    }]
  }]
}, {
  "title": "Daily Expressions",
  "short": "Ungkapan sehari-hari",
  "desc": "Belajar ungkapan bahasa Inggris sehari-hari",
  "icon": "chat",
  "color": "sky",
  "levels": [{
    "title": "Salam dan sapaan",
    "items": [{
      "en": "Good morning!",
      "id": "Selamat pagi!",
      "pic": "🌅🧒👧"
    }, {
      "en": "Good afternoon!",
      "id": "Selamat siang!",
      "pic": "☀️🧒👧"
    }, {
      "en": "See you!",
      "id": "Sampai jumpa!",
      "pic": "👧👋🧒"
    }]
  }, {
    "title": "Ungkapan sopan",
    "items": [{
      "en": "Thank you!",
      "id": "Terima kasih!",
      "pic": "🎁👧"
    }, {
      "en": "Excuse me!",
      "id": "Permisi!",
      "pic": "🧒🚪"
    }, {
      "en": "I am sorry.",
      "id": "Maaf.",
      "pic": "🧒💔"
    }]
  }, {
    "title": "Di kelas",
    "items": [{
      "en": "May I come in?",
      "id": "Bolehkah aku masuk?",
      "pic": "👧🚪"
    }, {
      "en": "Please sit down.",
      "id": "Silakan duduk.",
      "pic": "🧒🪑"
    }, {
      "en": "Raise your hand.",
      "id": "Angkat tanganmu.",
      "pic": "👧✋"
    }]
  }, {
    "title": "Setiap hari",
    "items": [{
      "en": "Good night!",
      "id": "Selamat malam!",
      "pic": "🌙🛏️"
    }, {
      "en": "Have fun!",
      "id": "Selamat bersenang-senang!",
      "pic": "🛝🧒"
    }, {
      "en": "Welcome home!",
      "id": "Selamat datang di rumah!",
      "pic": "🏡👧"
    }]
  }, {
    "title": "Ulangi ungkapan",
    "items": [{
      "en": "Good morning!",
      "id": "Selamat pagi!",
      "pic": "🌅🧒👧"
    }, {
      "en": "Thank you!",
      "id": "Terima kasih!",
      "pic": "🎁👧"
    }, {
      "en": "May I come in?",
      "id": "Bolehkah aku masuk?",
      "pic": "👧🚪"
    }, {
      "en": "Good night!",
      "id": "Selamat malam!",
      "pic": "🌙🛏️"
    }]
  }]
}, {
  "title": "Simple Sentences",
  "short": "Kalimat sederhana",
  "desc": "Belajar membaca kalimat bahasa Inggris sederhana",
  "icon": "book",
  "color": "butter",
  "levels": [{
    "title": "Tentang diriku",
    "items": [{
      "en": "I have a book.",
      "id": "Aku punya buku.",
      "pic": "🧒📘"
    }, {
      "en": "I like apples.",
      "id": "Aku suka apel.",
      "pic": "👧🍎"
    }, {
      "en": "I have a bag.",
      "id": "Aku punya tas.",
      "pic": "🧒🎒"
    }]
  }, {
    "title": "Keluarga dan teman",
    "items": [{
      "en": "This is my cat.",
      "id": "Ini kucingku.",
      "pic": "👧🐈"
    }, {
      "en": "This is my dad.",
      "id": "Ini ayahku.",
      "pic": "🧒👨"
    }, {
      "en": "We are friends.",
      "id": "Kami berteman.",
      "pic": "🧒👧"
    }]
  }, {
    "title": "Sekolahku",
    "items": [{
      "en": "I read a book.",
      "id": "Aku membaca buku.",
      "pic": "👧📖"
    }, {
      "en": "My bag is blue.",
      "id": "Tasku berwarna biru.",
      "pic": "🎒🔵"
    }, {
      "en": "I have a pencil.",
      "id": "Aku punya pensil.",
      "pic": "🧒✏️"
    }]
  }, {
    "title": "Kegiatan sehari-hari",
    "items": [{
      "en": "I drink milk.",
      "id": "Aku minum susu.",
      "pic": "🧒🥛"
    }, {
      "en": "I play football.",
      "id": "Aku bermain sepak bola.",
      "pic": "👧⚽"
    }, {
      "en": "The sun is hot.",
      "id": "Matahari terasa panas.",
      "pic": "☀️🥵"
    }]
  }, {
    "title": "Ulangi kalimat",
    "items": [{
      "en": "I have a book.",
      "id": "Aku punya buku.",
      "pic": "🧒📘"
    }, {
      "en": "This is my cat.",
      "id": "Ini kucingku.",
      "pic": "👧🐈"
    }, {
      "en": "I read a book.",
      "id": "Aku membaca buku.",
      "pic": "👧📖"
    }, {
      "en": "I drink milk.",
      "id": "Aku minum susu.",
      "pic": "🧒🥛"
    }]
  }]
}];
const GAMES = [{
  "title": "Tebak Suara",
  "desc": "Dengarkan dan pilih kata yang benar!",
  "icon": "phones",
  "color": "grape"
}, {
  "title": "Susun Kata",
  "desc": "Susun huruf menjadi kata yang benar!",
  "icon": "blocks",
  "color": "butter"
}, {
  "title": "Cocokkan Gambar",
  "desc": "Pilih kata yang sesuai dengan gambar!",
  "icon": "cards",
  "color": "mint"
}, {
  "title": "Bicara & Skor",
  "desc": "Ucapkan kata dan dapatkan skor!",
  "icon": "mic",
  "color": "peach"
}];
const ART = {
  "🍎": "1f34e.png",
  "🐻": "1f43b.png",
  "🐈": "1f408.png",
  "🐕": "1f415.png",
  "🥚": "1f95a.png",
  "🐟": "1f41f.png",
  "🐐": "1f410.png",
  "👒": "1f452.png",
  "🍦": "1f366.png",
  "🧃": "1f9c3.png",
  "🪁": "1fa81.png",
  "🦁": "1f981.png",
  "🌙": "1f319.png",
  "🪺": "1faba.png",
  "🍊": "1f34a.png",
  "✏": "270f.png",
  "👸": "1f478.png",
  "🐇": "1f407.png",
  "☀": "2600.png",
  "🌳": "1f333.png",
  "☂": "2602.png",
  "🎻": "1f3bb.png",
  "🐳": "1f433.png",
  "🎵": "1f3b5.png",
  "🪀": "1fa80.png",
  "🦓": "1f993.png",
  "🍌": "1f34c.png",
  "🍐": "1f350.png",
  "📘": "1f4d8.png",
  "🎒": "1f392.png",
  "📏": "1f4cf.png",
  "🔴": "1f534.png",
  "🔵": "1f535.png",
  "🟢": "1f7e2.png",
  "🟡": "1f7e1.png",
  "🧢": "1f9e2.png",
  "🔑": "1f511.png",
  "🕒": "1f552.png",
  "🛏": "1f6cf.png",
  "🌅": "1f305.png",
  "🧒": "1f9d2.png",
  "👧": "1f467.png",
  "👋": "1f44b.png",
  "🎁": "1f381.png",
  "🚪": "1f6aa.png",
  "💔": "1f494.png",
  "🪑": "1fa91.png",
  "✋": "270b.png",
  "🛝": "1f6dd.png",
  "🏡": "1f3e1.png",
  "👨": "1f468.png",
  "📖": "1f4d6.png",
  "🥛": "1f95b.png",
  "⚽": "26bd.png",
  "🥵": "1f975.png"
};
const SOUNDS = {
  "A": "v000.mp3",
  "Apple": "v001.mp3",
  "B": "v002.mp3",
  "Bag": "v003.mp3",
  "Banana": "v004.mp3",
  "Bear": "v005.mp3",
  "Bed": "v006.mp3",
  "Blue": "v007.mp3",
  "Book": "v008.mp3",
  "C": "v009.mp3",
  "Cap": "v010.mp3",
  "Cat": "v011.mp3",
  "Clock": "v012.mp3",
  "D": "v013.mp3",
  "Dog": "v014.mp3",
  "E": "v015.mp3",
  "Egg": "v016.mp3",
  "Excuse me!": "v017.mp3",
  "F": "v018.mp3",
  "Fish": "v019.mp3",
  "G": "v020.mp3",
  "Goat": "v021.mp3",
  "Good afternoon!": "v022.mp3",
  "Good morning!": "v023.mp3",
  "Good night!": "v024.mp3",
  "Green": "v025.mp3",
  "H": "v026.mp3",
  "Hat": "v027.mp3",
  "Have fun!": "v028.mp3",
  "I": "v029.mp3",
  "I am sorry.": "v030.mp3",
  "I drink milk.": "v031.mp3",
  "I have a bag.": "v032.mp3",
  "I have a book.": "v033.mp3",
  "I have a pencil.": "v034.mp3",
  "I like apples.": "v035.mp3",
  "I play football.": "v036.mp3",
  "I read a book.": "v037.mp3",
  "Ice cream": "v038.mp3",
  "J": "v039.mp3",
  "Juice": "v040.mp3",
  "K": "v041.mp3",
  "Key": "v042.mp3",
  "Kite": "v043.mp3",
  "L": "v044.mp3",
  "Lion": "v045.mp3",
  "M": "v046.mp3",
  "May I come in?": "v047.mp3",
  "Moon": "v048.mp3",
  "My bag is blue.": "v049.mp3",
  "N": "v050.mp3",
  "Nest": "v051.mp3",
  "O": "v052.mp3",
  "Orange": "v053.mp3",
  "P": "v054.mp3",
  "Pear": "v055.mp3",
  "Pencil": "v056.mp3",
  "Please sit down.": "v057.mp3",
  "Q": "v058.mp3",
  "Queen": "v059.mp3",
  "R": "v060.mp3",
  "Rabbit": "v061.mp3",
  "Raise your hand.": "v062.mp3",
  "Red": "v063.mp3",
  "Ruler": "v064.mp3",
  "S": "v065.mp3",
  "See you!": "v066.mp3",
  "Sun": "v067.mp3",
  "T": "v068.mp3",
  "Thank you!": "v069.mp3",
  "The sun is hot.": "v070.mp3",
  "This is my cat.": "v071.mp3",
  "This is my dad.": "v072.mp3",
  "Tree": "v073.mp3",
  "U": "v074.mp3",
  "Umbrella": "v075.mp3",
  "V": "v076.mp3",
  "Violin": "v077.mp3",
  "W": "v078.mp3",
  "We are friends.": "v079.mp3",
  "Welcome home!": "v080.mp3",
  "Whale": "v081.mp3",
  "X": "v082.mp3",
  "Xylophone": "v083.mp3",
  "Y": "v084.mp3",
  "Yellow": "v085.mp3",
  "Yo-yo": "v086.mp3",
  "Z": "v087.mp3",
  "Zebra": "v088.mp3"
};
