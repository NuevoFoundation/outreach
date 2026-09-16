// Generates the standalone flyer pages for every language from one template so
// each translation keeps identical layout, branding, and assets.
// Run: node .\site\tools\build-flyers.mjs
import { readFile, writeFile } from "node:fs/promises";

const siteDir = new URL("../", import.meta.url);
const engagementUrl =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR23fuGVglxBBl1KGeP0580dUQ1hUMVFQMjlFRlhQMFlKSTVGWEhBVUYxQSQlQCN0PWcu";

// English wording is the approved campaign copy. Metrics are never re-stated.
export const flyerContent = {
  en: {
    htmlLang: "en",
    file: "flyer.html",
    title: "Nuevo Foundation outreach flyer",
    description: "Bring an inspiring STEM experience to your students with Nuevo Foundation's coding workshops, virtual sessions, and STEM speakers.",
    home: "Visit the Nuevo Foundation homepage",
    org: "Seattle-based 501(c)(3)<br>STEM nonprofit",
    eyebrow: "For families, schools, and community groups",
    headline: "Bring an inspiring STEM experience to your students.",
    lead: "We help young people become curious, confident, and courageous through hands-on coding, relatable role models, and engaging STEM experiences.",
    mascotAlt: "Nuevo Foundation mascot holding a laptop",
    programsLabel: "Programs",
    programs: [
      ["Coding workshops", "Guided, hands-on activities help students build technology skills and confidence."],
      ["Virtual sessions", "Flexible online experiences connect learners with STEM from wherever they are."],
      ["STEM speakers", "Real stories from professionals help students see a place for themselves in STEM."],
    ],
    impactTitle: "Our impact",
    impactLead: "Expanding access to welcoming, relevant STEM experiences worldwide.",
    metrics: [
      ["students reached", "23,737"],
      ["countries", "33"],
      ["territories", "6"],
      ["languages", "7"],
      ["more interested in STEM", "85%"],
      ["believed they learned to code", "90%"],
    ],
    contactTitle: "Start a conversation.",
    contactLead: "Tell us about your learners and the experience you have in mind.",
    homepage: "Visit nuevofoundation.org",
    cta: "Request an engagement",
    ctaNote: "(opens Microsoft Forms in a new tab)",
    languageLabel: "Language",
  },
  es: {
    htmlLang: "es",
    file: "flyer-es.html",
    title: "Folleto de divulgación de Nuevo Foundation",
    description: "Lleve una experiencia STEM inspiradora a sus estudiantes con los talleres de programación, las sesiones virtuales y las charlas de Nuevo Foundation.",
    home: "Visitar la página principal de Nuevo Foundation",
    org: "Organización sin fines de lucro 501(c)(3)<br>de STEM con sede en Seattle",
    eyebrow: "Para familias, escuelas y grupos comunitarios",
    headline: "Lleve una experiencia STEM inspiradora a sus estudiantes.",
    lead: "Ayudamos a que las y los jóvenes sean curiosos, seguros y valientes mediante programación práctica, modelos a seguir cercanos y experiencias STEM atractivas.",
    mascotAlt: "Mascota de Nuevo Foundation sosteniendo una computadora portátil",
    programsLabel: "Programas",
    programs: [
      ["Talleres de programación", "Actividades prácticas y guiadas ayudan a las y los estudiantes a desarrollar habilidades tecnológicas y confianza."],
      ["Sesiones virtuales", "Experiencias en línea flexibles conectan a quienes aprenden con STEM desde donde estén."],
      ["Charlas con profesionales de STEM", "Historias reales de profesionales ayudan a las y los estudiantes a verse a sí mismos en STEM."],
    ],
    impactTitle: "Nuestro impacto",
    impactLead: "Ampliamos el acceso a experiencias STEM acogedoras y relevantes en todo el mundo.",
    metrics: [
      ["estudiantes alcanzados", "23,737"],
      ["países", "33"],
      ["territorios", "6"],
      ["idiomas", "7"],
      ["más interés en STEM", "85%"],
      ["consideró que aprendió a programar", "90%"],
    ],
    contactTitle: "Iniciemos una conversación.",
    contactLead: "Cuéntenos sobre sus estudiantes y la experiencia que tiene en mente.",
    homepage: "Visite nuevofoundation.org",
    cta: "Solicitar una colaboración",
    ctaNote: "(abre Microsoft Forms en una pestaña nueva)",
    languageLabel: "Idioma",
  },
  fr: {
    htmlLang: "fr",
    file: "flyer-fr.html",
    title: "Brochure de sensibilisation Nuevo Foundation",
    description: "Offrez à vos élèves une expérience STIM inspirante grâce aux ateliers de programmation, aux séances virtuelles et aux rencontres de Nuevo Foundation.",
    home: "Visiter la page d'accueil de Nuevo Foundation",
    org: "Organisme à but non lucratif 501(c)(3)<br>en STIM basé à Seattle",
    eyebrow: "Pour les familles, les écoles et les groupes communautaires",
    headline: "Offrez à vos élèves une expérience STIM inspirante.",
    lead: "Nous aidons les jeunes à devenir curieux, confiants et courageux grâce à la programmation pratique, à des modèles auxquels s'identifier et à des expériences STIM stimulantes.",
    mascotAlt: "Mascotte de Nuevo Foundation tenant un ordinateur portable",
    programsLabel: "Programmes",
    programs: [
      ["Ateliers de programmation", "Des activités pratiques et guidées aident les élèves à développer leurs compétences technologiques et leur confiance."],
      ["Séances virtuelles", "Des expériences en ligne souples relient les apprenants aux STIM, où qu'ils soient."],
      ["Rencontres avec des professionnels des STIM", "Des parcours réels aident les élèves à se projeter dans les STIM."],
    ],
    impactTitle: "Notre impact",
    impactLead: "Élargir l'accès à des expériences STIM accueillantes et pertinentes partout dans le monde.",
    metrics: [
      ["élèves touchés", "23 737"],
      ["pays", "33"],
      ["territoires", "6"],
      ["langues", "7"],
      ["plus d'intérêt pour les STIM", "85 %"],
      ["estiment avoir appris à programmer", "90 %"],
    ],
    contactTitle: "Entamons la conversation.",
    contactLead: "Parlez-nous de vos apprenants et de l'expérience que vous imaginez.",
    homepage: "Visitez nuevofoundation.org",
    cta: "Demander une collaboration",
    ctaNote: "(ouvre Microsoft Forms dans un nouvel onglet)",
    languageLabel: "Langue",
  },
  "pt-br": {
    htmlLang: "pt-BR",
    file: "flyer-pt-br.html",
    title: "Folheto de divulgação da Nuevo Foundation",
    description: "Leve uma experiência inspiradora de STEM aos seus estudantes com as oficinas de programação, as sessões virtuais e as palestras da Nuevo Foundation.",
    home: "Visitar a página inicial da Nuevo Foundation",
    org: "Organização sem fins lucrativos 501(c)(3)<br>de STEM sediada em Seattle",
    eyebrow: "Para famílias, escolas e grupos comunitários",
    headline: "Leve uma experiência inspiradora de STEM aos seus estudantes.",
    lead: "Ajudamos jovens a se tornarem curiosos, confiantes e corajosos por meio de programação prática, exemplos inspiradores e experiências envolventes de STEM.",
    mascotAlt: "Mascote da Nuevo Foundation segurando um notebook",
    programsLabel: "Programas",
    programs: [
      ["Oficinas de programação", "Atividades práticas e guiadas ajudam os estudantes a desenvolver habilidades tecnológicas e confiança."],
      ["Sessões virtuais", "Experiências on-line flexíveis conectam quem aprende a STEM de onde estiver."],
      ["Palestras com profissionais de STEM", "Histórias reais de profissionais ajudam os estudantes a se enxergarem em STEM."],
    ],
    impactTitle: "Nosso impacto",
    impactLead: "Ampliando o acesso a experiências de STEM acolhedoras e relevantes no mundo todo.",
    metrics: [
      ["estudantes alcançados", "23.737"],
      ["países", "33"],
      ["territórios", "6"],
      ["idiomas", "7"],
      ["mais interesse em STEM", "85%"],
      ["acharam que aprenderam a programar", "90%"],
    ],
    contactTitle: "Vamos começar uma conversa.",
    contactLead: "Conte para nós sobre seus estudantes e a experiência que você imagina.",
    homepage: "Visite nuevofoundation.org",
    cta: "Solicitar uma parceria",
    ctaNote: "(abre o Microsoft Forms em uma nova aba)",
    languageLabel: "Idioma",
  },
};

export const flyerLanguages = Object.freeze([
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt-br", label: "Português Brasileiro" },
]);

function languageLinks(current, content) {
  const links = flyerLanguages.map(({ code, label }) => {
    const target = flyerContent[code];
    const currentAttribute = code === current ? ' aria-current="true"' : "";
    return `<a href="./${target.file}" lang="${target.htmlLang}"${currentAttribute}>${label}</a>`;
  });
  return `      <nav class="flyer-languages" aria-label="${content.languageLabel}">\n        ${links.join("\n        ")}\n      </nav>`;
}

export function renderFlyer(code) {
  const content = flyerContent[code];
  const programs = content.programs
    .map(([heading, body], index) => `        <article>
          <span class="flyer-program-number" aria-hidden="true">0${index + 1}</span>
          <h2>${heading}</h2>
          <p>${body}</p>
        </article>`)
    .join("\n");
  const metrics = content.metrics
    .map(([label, value]) => `          <div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("\n");
  return `<!doctype html>
<html lang="${content.htmlLang}" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
    <meta name="description" content="${content.description}">
    <title>${content.title}</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./flyer.css">
  </head>
  <body class="flyer-page">
    <main class="flyer-sheet" aria-labelledby="flyer-title">
      <header class="flyer-brand">
        <a href="https://nuevofoundation.org/" aria-label="${content.home}">
          <img src="./assets/nuevo-foundation-logo.svg" width="940" height="150" alt="Nuevo Foundation">
        </a>
        <p>${content.org}</p>
      </header>
${languageLinks(code, content)}
      <section class="flyer-intro" aria-labelledby="flyer-title">
        <div>
          <p class="flyer-eyebrow">${content.eyebrow}</p>
          <h1 id="flyer-title">${content.headline}</h1>
          <p class="flyer-lead">${content.lead}</p>
        </div>
        <div class="flyer-mascot">
          <img src="./assets/nuevo-foundation-mascot.jpg" width="508" height="379" alt="${content.mascotAlt}">
        </div>
      </section>
      <section class="flyer-programs" aria-label="${content.programsLabel}">
${programs}
      </section>
      <section class="flyer-impact" aria-labelledby="impact-title">
        <div class="flyer-impact-heading">
          <h2 id="impact-title">${content.impactTitle}</h2>
          <p>${content.impactLead}</p>
        </div>
        <dl class="flyer-metrics">
${metrics}
        </dl>
      </section>
      <footer class="flyer-contact">
        <div>
          <h2>${content.contactTitle}</h2>
          <p>${content.contactLead}</p>
          <a class="flyer-homepage" href="https://nuevofoundation.org/">${content.homepage}</a>
        </div>
        <a class="button button-engagement" href="${engagementUrl}" target="_blank" rel="noopener noreferrer">${content.cta} <span aria-hidden="true">&#8599;</span><span class="sr-only">${content.ctaNote}</span></a>
      </footer>
    </main>
  </body>
</html>
`;
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (invokedDirectly) {
  // The English flyer is already approved, so confirm the template reproduces it
  // exactly apart from the new language row before overwriting anything.
  const existingEnglish = await readFile(new URL("flyer.html", siteDir), "utf8");
  const eol = existingEnglish.includes("\r\n") ? "\r\n" : "\n";
  const applyEol = (text) => (eol === "\n" ? text : text.replace(/\n/g, "\r\n"));
  const withoutNav = renderFlyer("en").replace(/^ {6}<nav class="flyer-languages"[\s\S]*?<\/nav>\n/m, "");
  if (applyEol(withoutNav) !== existingEnglish) {
    throw new Error("Template no longer reproduces the approved English flyer; refusing to write.");
  }
  for (const code of Object.keys(flyerContent)) {
    await writeFile(new URL(flyerContent[code].file, siteDir), applyEol(renderFlyer(code)), "utf8");
    console.log(`wrote ${flyerContent[code].file}`);
  }
  for (const asset of ["flyer.css", "styles.css", "assets/nuevo-foundation-logo.svg", "assets/nuevo-foundation-mascot.jpg"]) {
    await readFile(new URL(asset, siteDir));
  }
  console.log("English flyer reproduced exactly; all shared assets present");
}
