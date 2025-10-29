const MUSIC_WORDS_LIST = [
  "моцарт",
  "бетховен",
  "гендель",
  "верди",
  "глинка",
  "чайковский",
  "прокофьев",
  "рахманинов",
  "сметана",
  "малер",
  "брукнер",
  "аккорд",
  "адажио",
  "альтерация",
  "анданте",
  "ансамбль",
  "артикуляция",
  "арфа",
  "артист",
  "аудитория",
  "верхний-регистр",
  "верхняя-октава",
  "баритон",
  "бас",
  "сопрано",
  "альт",
  "тенор",
  "пиколо",
  "барабаны",
  "балалайка",
  "гитара",
  "баян",
  "баянист",
  "бел-канто",
  "бит",
  "блокфлейта",
  "валторна",
  "вальс",
  "вершина",
  "вибрация",
  "виолончель",
  "виолончелист",
  "виртуоз",
  "виртуозный",
  "вихрь",
  "вокал",
  "вокалист",
  "волынка",
  "волынщик",
  "время",
  "гамма",
  "гармония",
  "главный-инструмент",
  "гладкое-переливание",
  "глубина",
  "глубокий-звук",
  "глянцевый-звук",
  "гнусавость",
  "группа",
  "гусляр",
  "даргомыжский",
  "кантата",
  "ария",
  "концерт",
  "симфония",
  "соната",
  "оркестр",
  "камерный-оркестр",
  "вариации",
  "кастаньеты",
  "тамбурин",
  "фуга",
  "квинтет",
  "квартет",
  "токката",
  "балет",
  "трио",
  "прелюдия",
  "этюд",
  "клавикорд",
  "рояль",
  "месса",
  "хоровод",
  "опера",
  "джаз",
  "джентльмен",
  "дирижер",
  "интервал",
  "домбра",
  "дон-жуан",
  "дуэт",
  "флейта",
  "музыка",
  "классическая",
  "форте",
  "пиано",
];

interface PasswordStrength {
  password_ok: boolean;
  length_error: boolean;
  digit_error: boolean;
  symbol_error: boolean;
}

export function getPasswordStrength(password: string): PasswordStrength {
  const length_error = password.length < 8;
  const digit_error = !/\d/.test(password);
  const symbol_error = !/[ !#$%&'()*+,\-./[\\\]^_`{|}~"]/.test(password);
  const password_ok = !(length_error || digit_error || symbol_error);

  return {
    password_ok,
    length_error,
    digit_error,
    symbol_error,
  };
}

export function generatePassword(wordsCount: number = 2): string {
  const getRandomWord = () =>
    MUSIC_WORDS_LIST[Math.floor(Math.random() * MUSIC_WORDS_LIST.length)];

  const getRandomNumber = () => Math.floor(Math.random() * 99) + 1;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const words = Array.from({ length: wordsCount }, () => getRandomWord());
    const randomPassword = `${words.join("-")}-${getRandomNumber()}`.replace(
      / /g,
      "-"
    );

    if (getPasswordStrength(randomPassword).password_ok) {
      return randomPassword;
    }

    attempts++;
  }

  return `${getRandomWord()}-${getRandomWord()}-${getRandomNumber()}!`;
}
