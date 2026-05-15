const PROFILE = {
  name: "Emanuel Medeiros",
  email: "emanuelmedeiros291220@gmail.com",
  location: "Barcarena — PA",
  title: "Estudante de TI | Excel • Power BI • C# • SQL",
  objective:
    "Busca oportunidade como Jovem Aprendiz, Estagiário ou Auxiliar Administrativo Técnico, com foco em tecnologia, dados, informática administrativa e lógica de programação.",
};

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesAny(q, words) {
  return words.some((word) => q.includes(word));
}

function answer(message) {
  const q = normalize(message);

  if (!q) {
    return "Envie uma pergunta sobre Emanuel Medeiros, currículo, formação, habilidades, disponibilidade ou contato.";
  }

  if (includesAny(q, ["linkedin", "linkdee", "linkdin", "rede profissional"])) {
    return "O LinkedIn do Emanuel ainda não está ativo. No portfólio, ele aparece de forma discreta como “Em breve”. Por enquanto, os melhores canais profissionais são e-mail, WhatsApp e currículo online.";
  }

  if (includesAny(q, ["curriculo", "cv", "resume", "historico", "pagina online"])) {
    return "O currículo do Emanuel está disponível como página online no próprio site. Acesse /curriculo ou use o botão “Currículo online” para ver objetivo, formação, cursos, competências técnicas e disponibilidade.";
  }

  if (includesAny(q, ["contato", "email", "e-mail", "whats", "telefone", "instagram", "falar", "mensagem"])) {
    return `Para falar com ${PROFILE.name}, use os botões de contato do portfólio. Para contato profissional, o canal mais adequado é o e-mail: ${PROFILE.email}.`;
  }

  if (includesAny(q, ["habilidade", "competencia", "sabe", "excel", "power bi", "sql", "c#", "programacao", "office", "word", "powerpoint", "windows", "dados", "dashboard"])) {
    return "Emanuel tem foco em Excel avançado, Power BI, SQL básico, C# intermediário, lógica de programação, Pacote Office e Windows. A base dele combina organização de dados, criação de dashboards, consultas SQL, documentos profissionais e raciocínio lógico para resolver problemas.";
  }

  if (includesAny(q, ["formacao", "curso", "microlins", "escola", "ensino medio", "estuda", "certificado", "modulo"])) {
    return "Emanuel está cursando o Ensino Médio e faz formação profissionalizante pela Microlins Barcarena. A trilha inclui Lógica de Programação, Programação C#, Banco de Dados SQL, Power BI, Excel 2021, Excel Avançado, Word, PowerPoint, Windows 11, Marketing Digital, Google AdWords, Atendimento ao Cliente e Segurança Digital.";
  }

  if (includesAny(q, ["vaga", "oportunidade", "objetivo", "aprendiz", "estagio", "auxiliar", "trabalho", "disponibilidade", "contratar"])) {
    return PROFILE.objective + " Tem disponibilidade integral ou meio período, em formato presencial ou home office.";
  }

  if (includesAny(q, ["projeto", "portfolio", "dashboard", "planilha", "sistema", "github", "experiencia"])) {
    return "O portfólio apresenta a base técnica do Emanuel e pode evoluir com projetos práticos, como dashboards em Power BI, planilhas automatizadas no Excel, consultas SQL e sistemas simples em C#. O assistente não inventa experiência profissional: ele diferencia estudo, prática e projeto em desenvolvimento.";
  }

  if (includesAny(q, ["onde", "cidade", "local", "mora", "localizacao", "barcarena", "pa", "para", "endereco", "bairro"])) {
    return `A localização profissional exibida no portfólio é ${PROFILE.location}. Por privacidade, o site não destaca bairro nem endereço completo.`;
  }

  if (includesAny(q, ["quem", "sobre", "emanuel", "personalidade", "perfil", "apresente", "resumo"])) {
    return `${PROFILE.name} é ${PROFILE.title}. Ele estuda tecnologia com foco em dados, programação e informática aplicada ao ambiente administrativo, buscando evoluir por meio de formação profissionalizante, estudo constante e projetos práticos.`;
  }

  if (includesAny(q, ["idade", "anos", "menor"])) {
    return "Por privacidade, o portfólio não destaca idade. A apresentação profissional prioriza formação, competências, disponibilidade e canais de contato adequados.";
  }

  return "Posso responder sobre Emanuel Medeiros, currículo online, formação, cursos, habilidades técnicas, disponibilidade, contato e portfólio. Para manter precisão, não invento experiências nem informações fora da base profissional dele.";
}

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, session_id } = req.body || {};
  const reply = answer(message);

  return res.status(200).json({
    session_id: session_id || `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    reply,
  });
};
