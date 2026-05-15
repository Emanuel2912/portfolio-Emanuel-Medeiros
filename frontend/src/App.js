import { useEffect, useRef, useState, useCallback } from "react";
import "@/App.css";
import "@/index.css";
import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const NAV_ITEMS = [
    { id: "about",     label: "Sobre" },
    { id: "skills",    label: "Habilidades" },
    { id: "education", label: "Trajetória" },
    { id: "beyond",    label: "Universo" },
    { id: "contact",   label: "Contato", cta: true },
];

function useRouteState() {
    const [path, setPath] = useState(() => window.location.pathname || "/");

    const navigate = useCallback((to) => {
        if (window.location.pathname !== to) {
            window.history.pushState({}, "", to);
        }
        setPath(to);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    useEffect(() => {
        const onPop = () => setPath(window.location.pathname || "/");
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    return { path, navigate };
}

/* ═══════════════════ Site atmospheric background ═══════════════════ */
function SiteBackground() {
    return (
        <div className="site-bg" aria-hidden="true">
            <div className="theme-wash" />
            <div className="theme-orb orb-one" />
            <div className="theme-orb orb-two" />
            <div className="theme-grid" />
            <div className="theme-noise" />
            <div className="theme-vignette" />
        </div>
    );
}

/* ═══════════════════ Custom cursor ═══════════════════ */
function CustomCursor() {
    const ringRef = useRef(null);
    const dotRef = useRef(null);

    useEffect(() => {
        if (window.matchMedia("(hover: none)").matches) return;

        let rx = 0, ry = 0, tx = 0, ty = 0;
        const onMove = (e) => {
            tx = e.clientX;
            ty = e.clientY;
            if (dotRef.current) {
                dotRef.current.style.left = `${tx}px`;
                dotRef.current.style.top = `${ty}px`;
                dotRef.current.style.opacity = "1";
            }
            if (ringRef.current) ringRef.current.style.opacity = "1";
        };

        const onOut = () => {
            if (dotRef.current) dotRef.current.style.opacity = "0";
            if (ringRef.current) ringRef.current.style.opacity = "0";
        };

        const onOver = (e) => {
            const isHover = e.target.closest("a, button, .mini-card, .beyond-card, .category-card, .suggestion-chip, input");
            if (ringRef.current) ringRef.current.classList.toggle("hover", !!isHover);
        };

        const loop = () => {
            rx += (tx - rx) * 0.18;
            ry += (ty - ry) * 0.18;
            if (ringRef.current) {
                ringRef.current.style.left = `${rx}px`;
                ringRef.current.style.top = `${ry}px`;
            }
            requestAnimationFrame(loop);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseout", onOut);
        window.addEventListener("mouseover", onOver);
        loop();

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseout", onOut);
            window.removeEventListener("mouseover", onOver);
        };
    }, []);

    return (
        <>
            <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
            <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
        </>
    );
}

/* ═══════════════════ Scroll progress bar ═══════════════════ */
function ScrollProgress() {
    const ref = useRef(null);
    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
            if (ref.current) ref.current.style.width = `${pct}%`;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}

/* ═══════════════════ Theme transitions on scroll ═══════════════════ */
function useSectionTheme(route) {
    useEffect(() => {
        const sectionIds = route === "/curriculo"
            ? ["resume"]
            : ["home", "about", "skills", "education", "beyond", "contact"];
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        const themeMap = {
            home: "hero",
            about: "about",
            skills: "skills",
            education: "education",
            beyond: "beyond",
            contact: "contact",
            resume: "education",
        };

        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the most visible section
                let best = null;
                let bestRatio = 0;
                entries.forEach((e) => {
                    if (e.intersectionRatio > bestRatio) {
                        bestRatio = e.intersectionRatio;
                        best = e.target.id;
                    }
                });
                if (best && themeMap[best]) {
                    document.body.dataset.theme = themeMap[best];
                }
            },
            { threshold: [0.2, 0.4, 0.6, 0.8] }
        );

        sections.forEach((s) => observer.observe(s));
        return () => observer.disconnect();
    }, [route]);
}

/* ═══════════════════ Hero particles ═══════════════════ */
function HeroParticles() {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        const count = 22;
        const host = ref.current;
        host.innerHTML = "";
        for (let i = 0; i < count; i++) {
            const el = document.createElement("span");
            const delay = Math.random() * 10;
            const dur = 12 + Math.random() * 14;
            const x = Math.random() * 100;
            el.style.left = `${x}%`;
            el.style.bottom = "-10vh";
            el.style.animationDuration = `${dur}s`;
            el.style.animationDelay = `-${delay}s`;
            el.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
            host.appendChild(el);
        }
    }, []);
    return <div ref={ref} className="hero-particles" aria-hidden="true" />;
}

/* ═══════════════════ Navbar ═══════════════════ */
function Navbar({ onHomeSection, onResume, isResume }) {
    const [active, setActive] = useState("home");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
            },
            { rootMargin: "-45% 0px -45% 0px" }
        );
        ["home", ...NAV_ITEMS.map((n) => n.id)].forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const goTo = (id) => {
        onHomeSection(id);
        setOpen(false);
    };

    const goToResume = () => {
        onResume();
        setOpen(false);
    };

    return (
        <nav className="navbar" data-testid="main-navbar">
            <div className="nav-inner">
                <a href="#home"
                   className="nav-brand"
                   onClick={(e) => { e.preventDefault(); goTo("home"); }}
                   data-testid="nav-brand">
                    <div className="logo-mark" style={{ backgroundImage: "url(/assets/logo-e.png)" }} />
                    <div className="logo-divider" />
                    <span className="logo-word">Emanuel Medeiros</span>
                </a>

                <button
                    className={`nav-toggle ${open ? "open" : ""}`}
                    onClick={() => setOpen((v) => !v)}
                    data-testid="nav-toggle"
                    aria-label="Abrir menu"
                >
                    <span /><span />
                </button>

                <div className={`nav-panel ${open ? "open" : ""}`} data-testid="nav-panel">
                    {NAV_ITEMS.map((n) => (
                        <button
                            key={n.id}
                            className={`nav-link ${n.cta ? "nav-link--cta" : ""} ${!isResume && active === n.id ? "active" : ""}`}
                            onClick={() => goTo(n.id)}
                            data-testid={`nav-link-${n.id}`}
                        >
                            {n.label}
                        </button>
                    ))}
                    <button
                        className={`nav-link nav-link--resume ${isResume ? "active" : ""}`}
                        onClick={goToResume}
                        data-testid="nav-link-resume"
                    >
                        Currículo
                    </button>
                </div>
            </div>
        </nav>
    );
}

/* ═══════════════════ HERO ═══════════════════ */
function Hero({ onHomeSection, onResume }) {
    const goTo = (id) => onHomeSection(id);
    return (
        <section id="home" className="panel hero" data-testid="hero-section">
            <div className="hero-media">
                <div className="hero-image" />
                <HeroParticles />
            </div>

            <div className="container hero-layout">
                <div className="hero-copy reveal reveal-d1">
                    <p className="eyebrow">Portfólio pessoal & profissional</p>
                    <h1>
                        EMANUEL<br />
                        <span>MEDEIROS</span>
                    </h1>
                    <p className="hero-role">Estudante de TI · Excel · Power BI · C# · SQL</p>

                    <div className="hero-stack" data-testid="hero-stack">
                        <span className="hero-stack-dot" />
                        <span className="hero-stack-item accent">TI</span>
                        <span className="hero-stack-item">Excel</span>
                        <span className="hero-stack-item">Power BI</span>
                        <span className="hero-stack-item">C#</span>
                        <span className="hero-stack-item">SQL</span>
                        <span className="hero-stack-item">Lógica</span>
                        <span className="hero-stack-item">Office</span>
                        <span className="hero-stack-item">Windows</span>
                        <span className="hero-stack-item accent">Microlins</span>
                    </div>

                    <p className="hero-description">
                        Estudante de Tecnologia da Informação com foco em organização de dados, informática aplicada
                        e lógica de programação. Busco minha primeira oportunidade como Jovem Aprendiz, Estagiário
                        ou Auxiliar Administrativo Técnico.
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={onResume} data-testid="hero-cta-primary">
                            Ver currículo online <i className="fas fa-file-lines" />
                        </button>
                        <button className="btn btn-ghost" onClick={() => goTo("about")} data-testid="hero-cta-secondary">
                            Explorar portfólio
                        </button>
                        <button className="btn btn-ghost" onClick={() => goTo("contact")} data-testid="hero-cta-contact">
                            Falar comigo <i className="fas fa-arrow-right" />
                        </button>
                    </div>
                </div>

                <aside className="hero-panel reveal reveal-d2">
                    <div className="hero-card glass-card">
                        <span className="card-label">Presença</span>
                        <p className="hero-quote">
                            "Entre linhas de código e acordes de violino, existe um universo silencioso."
                        </p>
                        <div className="hero-meta">
                            <span>Barcarena · PA</span>
                            <span>Aberto a aprender e crescer</span>
                        </div>
                    </div>
                    <div className="hero-mini-grid">
                        <div className="mini-card glass-card reveal reveal-d3">
                            <strong>Excel</strong>
                            <span>organização e análise</span>
                        </div>
                        <div className="mini-card glass-card reveal reveal-d4">
                            <strong>Power BI</strong>
                            <span>visualização de dados</span>
                        </div>
                        <div className="mini-card glass-card reveal reveal-d5">
                            <strong>C# & SQL</strong>
                            <span>lógica e estrutura</span>
                        </div>
                    </div>
                </aside>
            </div>

            <button className="scroll-cue" onClick={() => goTo("about")} aria-label="Descer para Sobre">
                <span className="scroll-cue-line" />
                <span>descer</span>
            </button>
        </section>
    );
}

/* ═══════════════════ ABOUT ═══════════════════ */
function About() {
    return (
        <section id="about" className="panel about" data-testid="about-section">
            <div className="about-media" />
            <div className="container">
                <div className="section-heading reveal">
                    <span className="section-kicker">sobre.</span>
                    <h2>Calma, presença e curiosidade.</h2>
                    <p>
                        Sou Emanuel Medeiros, estudante de Tecnologia da Informação com foco em organização de dados,
                        informática aplicada ao ambiente administrativo e lógica de programação. Gosto de tecnologia
                        com personalidade: útil, bonita e bem pensada.
                    </p>
                </div>

                <div className="about-grid">
                    <article className="glass-card bio-card reveal reveal-d1">
                        <div className="avatar-shell">
                            <div className="avatar-core"><i className="fas fa-user-astronaut" /></div>
                        </div>
                        <div>
                            <span className="card-label">Quem sou</span>
                            <p>
                                Nerd por essência, tranquilo por escolha e atento aos detalhes. Leio sobre relações
                                interpessoais, observo comportamentos e encontro equilíbrio em café, rock nacional
                                e instrumentais de violino, piano, guitarra e baixo.
                            </p>
                        </div>
                    </article>

                    <article className="glass-card text-card reveal reveal-d2">
                        <span className="card-label">Resumo profissional</span>
                        <p>
                            Estudante de Tecnologia da Informação com foco em organização de dados,
                            informática aplicada ao ambiente administrativo e lógica de programação. Busco minha
                            primeira oportunidade como Jovem Aprendiz, Estagiário ou Auxiliar Administrativo Técnico
                            para aplicar conhecimentos em Excel, Power BI, C#, SQL e Pacote Office.
                        </p>
                    </article>

                    <article className="glass-card disc-card reveal reveal-d3">
                        <span className="card-label">Perfil DISC</span>
                        <div className="disc-badges">
                            <span className="disc-badge disc-d">D · Dominante</span>
                            <span className="disc-badge disc-i">I · Influente</span>
                        </div>
                        <p>
                            Predominantemente <strong>D</strong> (foco em resultados, decisão rápida, senso de
                            liderança e direto ao ponto) com traços de <strong>I</strong> (comunicação fluida,
                            persuasão e facilidade social). Tomo a frente, decido com firmeza e conduzo
                            conversas engajando as pessoas pelo caminho.
                        </p>
                    </article>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════ SKILLS ═══════════════════ */
const SKILL_CATS = [
    {
        icon: "fa-chart-line",
        label: "Análise de Dados & BI",
        title: "Leitura, análise e apresentação.",
        items: [
            { name: "Excel Avançado", tag: "Avançado", desc: "Tabelas dinâmicas, PROCV, fórmulas avançadas, gráficos" },
            { name: "Power BI",        tag: "Ativo",    desc: "Dashboards, visualização e relatórios interativos" },
            { name: "SQL",             tag: "Básico",   desc: "Consultas, manipulação e análise de dados" },
        ],
    },
    {
        icon: "fa-laptop-code",
        label: "Desenvolvimento",
        title: "Estrutura, lógica e evolução.",
        items: [
            { name: "C#",                    tag: "Intermediário", desc: "Lógica, estruturas de controle, POO" },
            { name: "Lógica de Programação", tag: "Sólida",         desc: "Algoritmos e resolução de problemas" },
        ],
    },
    {
        icon: "fa-desktop",
        label: "Sistemas & Office",
        title: "Ferramentas do dia a dia profissional.",
        items: [
            { name: "Windows",         tag: "Avançado",     desc: "Uso de sistemas administrativos, digitação ágil" },
            { name: "Word",            tag: "Avançado",     desc: "Formatação avançada, documentos profissionais" },
            { name: "PowerPoint",      tag: "Avançado",     desc: "Apresentações corporativas e criativas" },
            { name: "Outlook",         tag: "Em uso",       desc: "Gestão de e-mails e agendas" },
        ],
    },
];

const SOFT_SKILLS = [
    "Comunicativo", "Persuasivo", "Proatividade", "Iniciativa",
    "Liderança", "Tomada de Decisão", "Condução de Conversas", "Trabalho em Equipe",
];

function Skills() {
    return (
        <section id="skills" className="panel skills" data-testid="skills-section">
            <div className="skills-media" />
            <div className="container">
                <div className="section-heading reveal">
                    <span className="section-kicker">habilidades.</span>
                    <h2>Capacidade técnica com visual limpo.</h2>
                    <p>
                        Competências adquiridas em formação profissionalizante e prática: dados, BI, lógica,
                        sistemas e ferramentas do ambiente corporativo.
                    </p>
                </div>

                <div className="skills-layout">
                    {SKILL_CATS.map((cat, i) => (
                        <div key={cat.label} className={`glass-card category-card reveal reveal-d${i + 1}`}>
                            <div className="category-head">
                                <i className={`fas ${cat.icon}`} />
                                <div>
                                    <span className="card-label">{cat.label}</span>
                                    <h3>{cat.title}</h3>
                                </div>
                            </div>

                            {cat.items.map((s) => (
                                <div key={s.name} className="skill-item">
                                    <div className="skill-line">
                                        <span className="skill-name">{s.name}</span>
                                        <span className="skill-tag">{s.tag}</span>
                                    </div>
                                    <div className="skill-track">
                                        <span className="skill-fill" />
                                    </div>
                                    {s.desc && <p className="skill-desc">{s.desc}</p>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="soft-panel glass-card reveal reveal-d4">
                    <div className="soft-panel-head">
                        <span className="section-kicker">habilidades comportamentais.</span>
                        <h3>Postura e atitude que sustentam o técnico.</h3>
                    </div>
                    <div className="soft-tags">
                        {SOFT_SKILLS.map((s) => <span key={s}>{s}</span>)}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════ EDUCATION ═══════════════════ */
const MICROLINS_TAGS = [
    "Lógica de Programação", "Programação C#", "Banco de Dados SQL", "Power BI",
    "Excel 2021", "Excel Avançado", "Word & PowerPoint", "Windows 11",
    "Marketing Digital", "Google AdWords", "Atendimento ao Cliente", "Segurança Digital",
];

function Education() {
    return (
        <section id="education" className="panel education" data-testid="education-section">
            <div className="education-media" />
            <div className="container">
                <div className="section-heading reveal">
                    <span className="section-kicker">trajetória.</span>
                    <h2>Uma base em construção, com direção.</h2>
                    <p>
                        Ainda no começo da jornada, mas com repertório técnico, disciplina e vontade séria de fazer bem feito.
                    </p>
                </div>

                <div className="timeline">
                    <article className="glass-card timeline-item reveal reveal-d1">
                        <span className="timeline-year">2026 — 2028</span>
                        <h3>Ensino Médio · 1º Ano (cursando)</h3>
                        <p>Formação escolar em andamento, construindo base acadêmica junto ao desenvolvimento técnico em TI.</p>
                        <span className="timeline-pill">Escola pública</span>
                    </article>

                    <article className="glass-card timeline-item reveal reveal-d2">
                        <span className="timeline-year">Formação complementar</span>
                        <h3>Microlins Barcarena · Formação profissionalizante em andamento</h3>
                        <p>
                            Trilha com módulos de programação, banco de dados, Power BI, Excel, Office,
                            marketing digital, atendimento ao cliente, segurança digital e produtividade corporativa.
                        </p>
                        <div className="timeline-list">
                            {MICROLINS_TAGS.map((t) => <span key={t}>{t}</span>)}
                        </div>
                    </article>
                </div>

                <div className="glass-card goal-box reveal reveal-d3">
                    <span className="card-label">Onde quero chegar</span>
                    <blockquote>
                        Busco oportunidade como Jovem Aprendiz, Estágio ou Auxiliar Administrativo Técnico na
                        área de tecnologia ou administrativa. Quero contribuir com organização, dados,
                        informática e lógica, enquanto cresço com consistência, responsabilidade e sede de evolução.
                    </blockquote>
                    <div className="goal-meta">
                        <span>Integral ou meio período</span>
                        <span>Presencial ou home office</span>
                        <span>Barcarena · PA</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════ BEYOND ═══════════════════ */
const BEYOND = [
    {
        icon: "fa-heartbeat",
        title: "Socorrista voluntário",
        desc: "Formação completa em APH por instrutores militares e bombeiros, atuando com primeiros socorros, RCP e resposta a emergências.",
    },
    {
        icon: "fa-dumbbell",
        title: "Atleta de força",
        desc: "Musculação desde os 11 anos, com foco em disciplina, consistência e powerlifting. Treino como quem lapida caráter.",
    },
    {
        icon: "fa-fire",
        title: "Muay Thai",
        desc: "Experiência em arte marcial que desenvolveu controle emocional, estratégia e presença diante da pressão.",
    },
    {
        icon: "fa-microchip",
        title: "Hardware autodidata",
        desc: "Interesse prático em montagem e manutenção de computadores, com autonomia para aprender e resolver problemas técnicos.",
    },
];

const MOTORS = [
    { label: "Café",             text: "O cappuccino é o ponto de interrogação bonito do meu dia." },
    { label: "Rock nacional",    text: "Gosto de letras que doem um pouco e ficam ecoando." },
    { label: "Instrumentais",    text: "Violino e piano dizem o que a pressa nunca consegue." },
    { label: "Relações humanas", text: "Entender pessoas é um projeto contínuo, profundo e necessário." },
];

function Beyond() {
    return (
        <section id="beyond" className="panel beyond" data-testid="beyond-section">
            <div className="beyond-media" />
            <div className="container">
                <div className="section-heading section-heading--light reveal">
                    <span className="section-kicker">o que me move.</span>
                    <h2>Mais do que currículo.</h2>
                    <p>
                        Meu universo pessoal também constrói minha forma de trabalhar: disciplina, sensibilidade,
                        coragem, atenção e gosto por aprender.
                    </p>
                </div>

                <div className="beyond-grid">
                    {BEYOND.map((b, i) => (
                        <article key={b.title} className={`glass-card beyond-card reveal reveal-d${i + 1}`}>
                            <div className="beyond-icon"><i className={`fas ${b.icon}`} /></div>
                            <h3>{b.title}</h3>
                            <p>{b.desc}</p>
                        </article>
                    ))}
                </div>

                <div className="personal-motors">
                    {MOTORS.map((m, i) => (
                        <div key={m.label} className={`glass-card motor-card reveal reveal-d${i + 1}`}>
                            <span>{m.label}</span>
                            <p>{m.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════ CONTACT ═══════════════════ */
const CONTACT_LINKS = [
    {
        id: "whatsapp",
        icon: "fab fa-whatsapp",
        label: "WhatsApp",
        sub: "Abrir conversa direta",
        href: "https://api.whatsapp.com/send/?phone=5591992259344&text=Ol%C3%A1+Emanuel%21+Vim+pelo+seu+portf%C3%B3lio.&type=phone_number&app_absent=0",
    },
    {
        id: "email",
        icon: "fas fa-envelope",
        label: "E-mail",
        sub: "Enviar mensagem formal",
        href: "mailto:emanuelmedeiros291220@gmail.com?subject=Contato%20via%20portfólio",
    },
    {
        id: "resume",
        icon: "fas fa-file-lines",
        label: "Currículo online",
        sub: "Abrir página do currículo",
        action: "resume",
    },
    {
        id: "instagram",
        icon: "fab fa-instagram",
        label: "Instagram",
        sub: "@_emanuel.medeiros",
        href: "https://www.instagram.com/_emanuel.medeiros",
    },
    {
        id: "linkedin",
        icon: "fab fa-linkedin-in",
        label: "LinkedIn",
        sub: "Em breve",
        disabled: true,
    },
];

function Contact({ onResume }) {
    return (
        <section id="contact" className="panel contact" data-testid="contact-section">
            <div className="contact-media" />
            <div className="container contact-layout">
                <div className="section-heading reveal">
                    <span className="section-kicker">contato.</span>
                    <h2>Aberto a oportunidades e boas conversas.</h2>
                    <p>
                        Se quiser falar sobre tecnologia, crescimento profissional, ideias ou oportunidades,
                        escolha o canal que preferir — é só um clique.
                    </p>
                </div>

                <div className="contact-channels">
                    {CONTACT_LINKS.map((c, i) => {
                        const inner = (
                            <>
                                <div className="channel-icon"><i className={c.icon} /></div>
                                <div className="channel-text">
                                    <strong>{c.label}</strong>
                                    <span>{c.sub}</span>
                                </div>
                                <i className={`fas ${c.disabled ? "fa-lock" : "fa-arrow-right"} channel-arrow`} />
                            </>
                        );

                        if (c.disabled) {
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    disabled
                                    className={`glass-card channel-card channel-card--disabled reveal reveal-d${i + 1}`}
                                    data-testid={`contact-${c.id}`}
                                    title="LinkedIn disponível futuramente"
                                >
                                    {inner}
                                </button>
                            );
                        }

                        if (c.action === "resume") {
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={onResume}
                                    className={`glass-card channel-card reveal reveal-d${i + 1}`}
                                    data-testid={`contact-${c.id}`}
                                >
                                    {inner}
                                </button>
                            );
                        }

                        return (
                            <a
                                key={c.id}
                                href={c.href}
                                target={c.id === "email" ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                className={`glass-card channel-card reveal reveal-d${i + 1}`}
                                data-testid={`contact-${c.id}`}
                            >
                                {inner}
                            </a>
                        );
                    })}
                </div>

                <div className="glass-card base-card reveal reveal-d4">
                    <span className="card-label">Base</span>
                    <p className="contact-location">
                        <i className="fas fa-location-dot" /> Barcarena · PA
                    </p>
                    <p className="contact-note">
                        Disponível integral ou meio período · presencial ou home office. Aberto a oportunidades
                        como Jovem Aprendiz, Estágio ou Auxiliar Administrativo Técnico.
                    </p>
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════ CURRÍCULO ONLINE ═══════════════════ */
const RESUME_TECH_GROUPS = [
    { title: "Dados & BI", items: ["Excel avançado", "Power BI", "Dashboards", "Gráficos", "SQL básico"] },
    { title: "Programação", items: ["C# intermediário", "Lógica de Programação", "Algoritmos", "POO"] },
    { title: "Office & Sistemas", items: ["Word", "PowerPoint", "Outlook", "Windows", "Sistemas administrativos"] },
];

const RESUME_COURSE_GROUPS = [
    { title: "Programação", items: ["Lógica de Programação", "Programação C#", "Banco de Dados com SQL"] },
    { title: "Dados", items: ["Power BI", "Excel 2021", "Excel 2021 Avançado"] },
    { title: "Office e sistemas", items: ["Word 2021", "PowerPoint 2021", "Windows 11"] },
    { title: "Administração e marketing", items: ["Atendimento ao Cliente", "Marketing Digital", "Google AdWords", "Empreendedor de Sucesso"] },
    { title: "Segurança", items: ["Segurança na Era Digital"] },
];

function CurriculumPage({ onHome, onContact }) {
    return (
        <main id="resume" className="resume-page panel" data-testid="resume-page">
            <div className="resume-media" />
            <div className="container resume-layout">
                <section className="glass-card resume-hero-card reveal in">
                    <span className="section-kicker">currículo online.</span>
                    <h1>Emanuel Medeiros</h1>
                    <p className="resume-role">Estudante de TI | Excel • Power BI • C# • SQL</p>
                    <p className="resume-summary">
                        Estudante de Tecnologia da Informação com foco em organização de dados, informática aplicada
                        ao ambiente administrativo e lógica de programação. Busca oportunidade como Jovem Aprendiz,
                        Estagiário ou Auxiliar Administrativo Técnico.
                    </p>
                    <div className="resume-actions">
                        <button className="btn btn-primary" onClick={onContact}>Entrar em contato</button>
                        <button className="btn btn-ghost" onClick={onHome}>Voltar ao portfólio</button>
                        <button className="btn btn-ghost" onClick={() => window.print()}>
                            Imprimir / salvar PDF <i className="fas fa-print" />
                        </button>
                    </div>
                </section>

                <section className="resume-grid">
                    <article className="glass-card resume-card reveal reveal-d1">
                        <span className="card-label">Objetivo profissional</span>
                        <p>
                            Busco oportunidade como Jovem Aprendiz, Estágio ou Auxiliar Administrativo Técnico na área
                            de tecnologia ou administrativa, para aplicar conhecimentos em organização de dados,
                            informática e lógica de programação, contribuindo com o desenvolvimento da empresa.
                        </p>
                    </article>

                    <article className="glass-card resume-card reveal reveal-d2">
                        <span className="card-label">Formação acadêmica</span>
                        <h3>Ensino Médio — 1º Ano</h3>
                        <p>Escola pública · cursando</p>
                        <p>Início: 2026 · previsão de conclusão: 2028</p>
                    </article>

                    <article className="glass-card resume-card resume-card--wide reveal reveal-d3">
                        <span className="card-label">Formação complementar</span>
                        <h3>Microlins Barcarena — Formação profissionalizante em andamento</h3>
                        <div className="resume-course-grid">
                            {RESUME_COURSE_GROUPS.map((group) => (
                                <div key={group.title} className="resume-course-group">
                                    <strong>{group.title}</strong>
                                    <div>
                                        {group.items.map((item) => <span key={item}>{item}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="glass-card resume-card resume-card--wide reveal reveal-d4">
                        <span className="card-label">Competências técnicas</span>
                        <div className="resume-tech-grid">
                            {RESUME_TECH_GROUPS.map((group) => (
                                <div key={group.title}>
                                    <h3>{group.title}</h3>
                                    <ul>
                                        {group.items.map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="glass-card resume-card reveal reveal-d5">
                        <span className="card-label">Habilidades comportamentais</span>
                        <div className="soft-tags resume-soft-tags">
                            {SOFT_SKILLS.map((s) => <span key={s}>{s}</span>)}
                        </div>
                    </article>

                    <article className="glass-card resume-card reveal reveal-d5">
                        <span className="card-label">Informações adicionais</span>
                        <p>Idioma: Português nativo</p>
                        <p>Disponibilidade: integral ou meio período</p>
                        <p>Formato: presencial ou home office</p>
                        <p>Localização pública: Barcarena · PA</p>
                    </article>
                </section>
            </div>
        </main>
    );
}

/* ═══════════════════ FOOTER ═══════════════════ */
function Footer() {
    return (
        <footer className="footer" data-testid="footer">
            <div className="footer-inner">
                <p>Feito com código, café e um pouco de melancolia.</p>
                <p>© 2026 · Emanuel Medeiros</p>
            </div>
        </footer>
    );
}

/* ═══════════════════ CHAT WIDGET ═══════════════════ */
const SUGGESTIONS = [
    "Quais habilidades o Emanuel tem?",
    "Conte sobre a formação dele",
    "Onde vejo o currículo?",
    "Ele tem LinkedIn?",
];

function getLocalAssistantReply(question) {
    const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (/linkedin|linkdee|linkdin|rede profissional/.test(q)) {
        return "O LinkedIn do Emanuel ainda não está ativo. No portfólio ele aparece de forma discreta como “Em breve”, porque a prioridade agora é manter contato por e-mail, WhatsApp e currículo online.";
    }

    if (/curriculo|cv|resume|historico/.test(q)) {
        return "O currículo do Emanuel está disponível em uma página online dentro do próprio site. Use o botão “Currículo online” ou acesse /curriculo para ver objetivo profissional, formação, cursos e competências técnicas.";
    }

    if (/contato|email|e-mail|whats|telefone|instagram|falar/.test(q)) {
        return "Para falar com Emanuel Medeiros, use os botões de contato do portfólio: WhatsApp, e-mail ou Instagram. Para uma abordagem profissional, o melhor canal é o e-mail: emanuelmedeiros291220@gmail.com.";
    }

    if (/habilidade|competencia|sabe|excel|power bi|sql|c#|programacao|office|word|powerpoint|windows/.test(q)) {
        return "Emanuel tem foco em Excel, Power BI, SQL, C#, lógica de programação, Pacote Office e Windows. A base mais forte está em organização de dados, dashboards, documentos profissionais, consultas básicas em SQL e desenvolvimento da lógica para resolver problemas.";
    }

    if (/formacao|curso|microlins|escola|ensino medio|estuda/.test(q)) {
        return "Emanuel está cursando o Ensino Médio e faz formação profissionalizante pela Microlins Barcarena. A trilha inclui Lógica de Programação, Programação C#, Banco de Dados SQL, Power BI, Excel, Office, Windows 11, Marketing Digital, Atendimento ao Cliente e Segurança Digital.";
    }

    if (/vaga|oportunidade|objetivo|aprendiz|estagio|auxiliar|trabalho|disponibilidade/.test(q)) {
        return "Emanuel busca sua primeira oportunidade como Jovem Aprendiz, Estagiário ou Auxiliar Administrativo Técnico, principalmente em áreas ligadas a tecnologia, dados, informática administrativa e organização. Ele tem disponibilidade integral ou meio período, presencial ou home office.";
    }

    if (/projeto|portfolio|dashboard|planilha|sistema|github/.test(q)) {
        return "O portfólio apresenta a base técnica do Emanuel e pode evoluir com projetos práticos, como dashboards em Power BI, planilhas automatizadas no Excel, consultas SQL e sistemas simples em C#. A ideia é demonstrar aprendizado real, não inventar experiência profissional.";
    }

    if (/onde|cidade|local|mora|localizacao|barcarena|pa|para/.test(q)) {
        return "A localização profissional exibida no portfólio é Barcarena — PA. Por privacidade, o site não destaca bairro ou endereço completo.";
    }

    if (/quem|sobre|emanuel|personalidade|perfil/.test(q)) {
        return "Emanuel Medeiros é estudante de Tecnologia da Informação, com foco em dados, programação e informática aplicada ao ambiente administrativo. O perfil dele combina disciplina, comunicação, curiosidade técnica e atenção aos detalhes.";
    }

    return "Posso responder sobre Emanuel Medeiros, currículo, formação, habilidades, cursos, disponibilidade, contato e portfólio. Para manter precisão, não invento experiências ou informações que não estejam na base profissional dele.";
}

function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Olá. Sou o assistente virtual do Emanuel Medeiros. Posso falar sobre formação, habilidades, currículo online, disponibilidade e contato. O que quer saber?",
            greeting: true,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const bodyRef = useRef(null);

    const scrollBottom = useCallback(() => {
        setTimeout(() => {
            if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }, 50);
    }, []);

    useEffect(() => { if (open) scrollBottom(); }, [messages, open, scrollBottom]);

    const send = async (text) => {
        const q = (text ?? input).trim();
        if (!q || loading) return;
        setMessages((m) => [...m, { role: "user", content: q }]);
        setInput("");
        setLoading(true);
        try {
            const res = await axios.post(`${API}/chat`, { message: q, session_id: sessionId }, { timeout: 15000 });
            if (!sessionId) setSessionId(res.data.session_id);
            setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
        } catch (err) {
            console.warn("API do chat indisponível. Usando resposta local controlada.", err);
            setMessages((m) => [...m, {
                role: "assistant",
                content: getLocalAssistantReply(q),
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                className="chat-fab"
                onClick={() => setOpen((v) => !v)}
                data-testid="chat-fab"
                aria-label="Abrir assistente virtual"
                title="Converse com IA sobre mim"
            >
                <i className={`fas ${open ? "fa-times" : "fa-comment-dots"}`} />
            </button>

            {open && (
                <div className="chat-window" data-testid="chat-window">
                    <div className="chat-header">
                        <div className="ai-dot"><i className="fas fa-sparkles" /></div>
                        <div className="title">
                            <h4>Assistente do portfólio</h4>
                            <div className="subtitle">Pergunte sobre Emanuel</div>
                        </div>
                        <button
                            className="chat-close"
                            onClick={() => setOpen(false)}
                            data-testid="chat-close"
                            aria-label="Fechar"
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>

                    <div className="chat-body" ref={bodyRef} data-testid="chat-body">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`msg ${m.role === "user" ? "user" : "bot"} ${m.greeting ? "greeting" : ""}`}
                                data-testid={`chat-msg-${m.role}-${i}`}
                            >
                                {m.content}
                            </div>
                        ))}
                        {loading && (
                            <div className="msg bot typing" data-testid="chat-typing">
                                <span /><span /><span />
                            </div>
                        )}
                    </div>

                    {messages.length <= 1 && (
                        <div className="suggestions">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    className="suggestion-chip"
                                    onClick={() => send(s)}
                                    data-testid={`suggestion-${s.slice(0, 10)}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); send(); }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Faça uma pergunta..."
                            disabled={loading}
                            data-testid="chat-input"
                        />
                        <button
                            type="submit"
                            className="chat-send"
                            disabled={loading || !input.trim()}
                            data-testid="chat-send"
                            aria-label="Enviar"
                        >
                            <i className="fas fa-paper-plane" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

/* ═══════════════════ Reveal hook ═══════════════════ */
function useReveal(route) {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("in");
                        observer.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );
        const t = setTimeout(() => {
            document.querySelectorAll(".reveal:not(.in)").forEach((el) => observer.observe(el));
        }, 80);
        return () => { clearTimeout(t); observer.disconnect(); };
    }, [route]);
}

/* ═══════════════════ APP ═══════════════════ */
function App() {
    const { path, navigate } = useRouteState();
    const isResume = path === "/curriculo";

    const goToResume = useCallback(() => navigate("/curriculo"), [navigate]);

    const goToHomeSection = useCallback((id) => {
        const scrollToSection = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (window.location.pathname !== "/") {
            navigate("/");
            setTimeout(scrollToSection, 80);
        } else {
            scrollToSection();
        }
    }, [navigate]);

    useReveal(path);
    useSectionTheme(path);

    useEffect(() => {
        document.title = isResume
            ? "Currículo | Emanuel Medeiros"
            : "Emanuel Medeiros | Portfólio de Tecnologia";
        document.body.dataset.theme = isResume ? "education" : "hero";
    }, [isResume]);

    return (
        <div className="App" data-testid="app-root">
            <SiteBackground />
            <CustomCursor />
            <ScrollProgress />
            <Navbar onHomeSection={goToHomeSection} onResume={goToResume} isResume={isResume} />
            {isResume ? (
                <CurriculumPage onHome={() => goToHomeSection("home")} onContact={() => goToHomeSection("contact")} />
            ) : (
                <main>
                    <Hero onHomeSection={goToHomeSection} onResume={goToResume} />
                    <About />
                    <Skills />
                    <Education />
                    <Beyond />
                    <Contact onResume={goToResume} />
                </main>
            )}
            <Footer />
            <ChatWidget />
        </div>
    );
}

export default App;
