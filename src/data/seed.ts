import type {
  Application, Candidate, CandidateSkill, DB, Skill, SkillCategory, Vacancy, DegreeKey, LangCode, KnowledgeBase, Requirement,
} from '../lib/types'

const d = (az: string, en: string, ru: string) => ({ az, en, ru })
const sk = (id: string, name: string, category: SkillCategory, level: number, description: ReturnType<typeof d>, related: string[], aliases?: string[]): Skill => ({
  id, name, category, level, description, related, aliases,
})

export const SEED_SKILLS: Skill[] = [
  sk('html', 'HTML', 'technical', 2, d('Veb səhifələrin strukturunu qurmaq üçün işarələmə dili.', 'Markup language used to structure web pages.', 'Язык разметки для структуры веб-страниц.'), ['css', 'js'], ['HTML5']),
  sk('css', 'CSS', 'technical', 3, d('Veb interfeyslərin üslubu, layout və animasiyaları.', 'Styling, layout and animation of web interfaces.', 'Стили, раскладка и анимации веб-интерфейсов.'), ['html', 'figma'], ['CSS3', 'Tailwind', 'SASS']),
  sk('js', 'JavaScript', 'technical', 4, d('Veb-in əsas proqramlaşdırma dili.', 'The core programming language of the web.', 'Основной язык программирования веба.'), ['html', 'ts', 'react', 'node', 'testing'], ['JS', 'ECMAScript']),
  sk('ts', 'TypeScript', 'technical', 4, d('Statik tiplərlə JavaScript üzərində qurulmuş dil.', 'A typed superset of JavaScript.', 'Типизированное надмножество JavaScript.'), ['js', 'react', 'node'], ['TS']),
  sk('react', 'React', 'technical', 4, d('Komponent əsaslı UI kitabxanası.', 'Component-based UI library.', 'Компонентная библиотека для UI.'), ['js', 'ts', 'node'], ['React.js', 'ReactJS', 'Next.js']),
  sk('node', 'Node.js', 'technical', 3, d('Server tərəfi JavaScript icra mühiti.', 'Server-side JavaScript runtime.', 'Серверная среда выполнения JavaScript.'), ['js', 'rest', 'ts'], ['NodeJS', 'Express']),
  sk('python', 'Python', 'technical', 3, d('Ümumi təyinatlı, data və backend üçün geniş istifadə olunan dil.', 'General-purpose language for data and backend work.', 'Универсальный язык для данных и бэкенда.'), ['ml', 'da', 'sql'], ['Django', 'Flask', 'Pandas']),
  sk('java', 'Java', 'technical', 4, d('Müəssisə tətbiqləri üçün obyekt yönümlü dil.', 'Object-oriented language for enterprise systems.', 'Объектно-ориентированный язык для корпоративных систем.'), ['sql', 'rest'], ['Spring', 'Spring Boot']),
  sk('sql', 'SQL', 'technical', 3, d('Relyasion verilənlər bazası sorğu dili.', 'Query language for relational databases.', 'Язык запросов к реляционным базам данных.'), ['da', 'python', 'java'], ['PostgreSQL', 'MySQL']),
  sk('git', 'Git', 'tools', 3, d('Versiya idarəetmə sistemi.', 'Distributed version control system.', 'Распределённая система контроля версий.'), ['docker'], ['GitHub', 'GitLab']),
  sk('docker', 'Docker', 'tools', 3, d('Konteynerləşdirmə və deploy aləti.', 'Containerization and deployment tool.', 'Контейнеризация и развёртывание.'), ['aws', 'git'], ['Kubernetes']),
  sk('aws', 'AWS', 'tools', 3, d('Bulud infrastrukturu xidmətləri.', 'Cloud infrastructure services.', 'Облачная инфраструктура.'), ['docker'], ['Amazon Web Services', 'Azure', 'GCP']),
  sk('rest', 'REST API', 'technical', 3, d('HTTP əsaslı API dizaynı və inteqrasiyası.', 'HTTP-based API design and integration.', 'Проектирование и интеграция HTTP API.'), ['node', 'java'], ['REST', 'GraphQL']),
  sk('testing', 'Testing', 'tools', 3, d('Avtomatlaşdırılmış və manual test təcrübəsi.', 'Automated and manual testing practice.', 'Автоматизированное и ручное тестирование.'), ['js'], ['Jest', 'Cypress', 'QA']),
  sk('figma', 'Figma', 'tools', 3, d('İnterfeys dizaynı və prototipləşdirmə aləti.', 'Interface design and prototyping tool.', 'Инструмент UI-дизайна и прототипирования.'), ['uiux', 'css']),
  sk('ml', 'Machine Learning', 'domain', 3, d('Verilənlərdən öyrənən modellərin qurulması.', 'Building models that learn from data.', 'Построение моделей, обучающихся на данных.'), ['python', 'da'], ['ML', 'Deep Learning']),
  sk('da', 'Data Analysis', 'domain', 3, d('Məlumatın təmizlənməsi, analizi və vizuallaşdırılması.', 'Cleaning, analysing and visualising data.', 'Очистка, анализ и визуализация данных.'), ['sql', 'python', 'ml'], ['Analytics', 'Power BI', 'Excel']),
  sk('uiux', 'UI/UX Design', 'domain', 3, d('İstifadəçi təcrübəsi və interfeys dizaynı prinsipləri.', 'User experience and interface design principles.', 'Принципы UX и дизайна интерфейсов.'), ['figma', 'css'], ['UX', 'UI Design']),
  sk('pm', 'Project Management', 'domain', 3, d('Layihələrin planlaşdırılması və idarə olunması.', 'Planning and delivering projects.', 'Планирование и управление проектами.'), ['lead', 'comm'], ['Agile', 'Scrum']),
  sk('comm', 'Communication', 'soft', 3, d('Aydın və təsirli ünsiyyət bacarığı.', 'Clear and effective communication.', 'Чёткая и эффективная коммуникация.'), ['team', 'lead']),
  sk('team', 'Teamwork', 'soft', 3, d('Komanda daxilində əməkdaşlıq.', 'Collaboration within a team.', 'Сотрудничество в команде.'), ['comm', 'adapt']),
  sk('lead', 'Leadership', 'soft', 3, d('Komandanı istiqamətləndirmək və motivasiya etmək.', 'Guiding and motivating a team.', 'Руководство и мотивация команды.'), ['comm', 'pm']),
  sk('problem', 'Problem Solving', 'soft', 4, d('Mürəkkəb problemləri analiz edib həll etmək.', 'Analysing and solving complex problems.', 'Анализ и решение сложных задач.'), ['creative', 'adapt']),
  sk('time', 'Time Management', 'soft', 3, d('Vaxtın səmərəli planlaşdırılması.', 'Planning time effectively.', 'Эффективное планирование времени.'), ['pm']),
  sk('adapt', 'Adaptability', 'soft', 3, d('Dəyişikliklərə sürətli uyğunlaşma.', 'Adapting quickly to change.', 'Быстрая адаптация к изменениям.'), ['team', 'problem']),
  sk('creative', 'Creativity', 'soft', 3, d('Qeyri-standart həllər tapmaq.', 'Finding non-standard solutions.', 'Поиск нестандартных решений.'), ['problem', 'uiux']),
]

export const SEED_KB: KnowledgeBase = {
  experienceLevels: [
    { id: 'junior', min: 0, max: 2, description: d('Rəhbərlik altında işləyən, əsas bacarıqlara sahib mütəxəssis.', 'Works under guidance with core skills.', 'Работает под руководством, владеет базовыми навыками.') },
    { id: 'mid', min: 2, max: 5, description: d('Müstəqil işləyən, tapşırıqları tam icra edən mütəxəssis.', 'Works independently and owns tasks end to end.', 'Работает самостоятельно и ведёт задачи от начала до конца.') },
    { id: 'senior', min: 5, max: 8, description: d('Texniki qərarlar verən və başqalarına mentorluq edən mütəxəssis.', 'Makes technical decisions and mentors others.', 'Принимает технические решения и наставляет других.') },
    { id: 'lead', min: 8, max: null, description: d('Komandanı və arxitekturanı idarə edən lider.', 'Leads teams and architecture.', 'Руководит командой и архитектурой.') },
  ],
  education: [
    { id: 'highschool', points: 40 },
    { id: 'college', points: 55 },
    { id: 'bachelor', points: 75 },
    { id: 'master', points: 90 },
    { id: 'phd', points: 100 },
  ],
  certs: [
    { id: 'cert-aws', name: 'AWS Certified Developer', issuer: 'Amazon', skills: ['aws', 'docker'] },
    { id: 'cert-meta', name: 'Meta Front-End Developer', issuer: 'Meta', skills: ['react', 'js', 'css', 'html'] },
    { id: 'cert-oracle', name: 'Oracle Certified Professional Java SE', issuer: 'Oracle', skills: ['java', 'sql'] },
    { id: 'cert-google-da', name: 'Google Data Analytics', issuer: 'Google', skills: ['da', 'sql'] },
    { id: 'cert-tf', name: 'TensorFlow Developer', issuer: 'Google', skills: ['ml', 'python'] },
    { id: 'cert-pmp', name: 'PMP', issuer: 'PMI', skills: ['pm', 'lead'] },
    { id: 'cert-ielts', name: 'IELTS Academic', issuer: 'British Council', skills: ['comm'] },
    { id: 'cert-ux', name: 'Google UX Design', issuer: 'Google', skills: ['uiux', 'figma'] },
  ],
  rules: [
    { id: 'interview', min: 85, enabled: true },
    { id: 'assess', min: 70, enabled: true },
    { id: 'reserve', min: 50, enabled: true },
    { id: 'low', min: 0, enabled: true },
  ],
  weights: { technical: 40, experience: 20, education: 15, soft: 10, certs: 5, languages: 10 },
}

type SK = [string, number]
const cs = (arr: SK[]): CandidateSkill[] => arr.map(([skillId, level]) => ({ skillId, level }))
const L = (arr: [LangCode, number][]) => arr.map(([lang, level]) => ({ lang, level }))

interface CandInput {
  id: string; name: string; email: string; phone: string; location: string; title: string; summary: string; hue: number
  skills: SK[]; exp: [string, string, number, number | null, string, string[]][]; edu: [DegreeKey, string, string, number][]
  certs: [string, string, number][]; langs: [LangCode, number][]; gh: [string, number, number, string[]] | null; portfolio: string; created: string
}
const mk = (c: CandInput): Candidate => ({
  id: c.id, name: c.name, email: c.email, phone: c.phone, location: c.location, title: c.title, summary: c.summary, hue: c.hue,
  skills: cs(c.skills),
  experience: c.exp.map(([role, company, from, to, description, skills], i) => ({ id: `${c.id}-x${i}`, role, company, from, to, description, skills })),
  education: c.edu.map(([degree, field, school, year], i) => ({ id: `${c.id}-e${i}`, degree, field, school, year })),
  certificates: c.certs.map(([name, issuer, year], i) => ({ id: `${c.id}-c${i}`, name, issuer, year })),
  languages: L(c.langs),
  github: c.gh ? { user: c.gh[0], repos: c.gh[1], stars: c.gh[2], langs: c.gh[3] } : null,
  portfolio: c.portfolio, createdAt: c.created,
})

export const SEED_CANDIDATES: Candidate[] = [
  mk({ id: 'c1', name: 'Aysel Məmmədova', email: 'candidate@skillora.demo', phone: '+994 50 311 24 08', location: 'Bakı', title: 'Frontend Developer', summary: 'Komponent əsaslı interfeyslər və dizayn sistemləri üzərində işləyən frontend mühəndisi. Performans və əlçatanlığa xüsusi önəm verir.', hue: 74,
    skills: [['html', 5], ['css', 4], ['js', 4], ['ts', 3], ['react', 4], ['git', 4], ['figma', 3], ['testing', 2], ['comm', 4], ['team', 5], ['problem', 4], ['time', 3]],
    exp: [['Frontend Developer', 'PashaTech', 2021, null, 'Korporativ dashboard və dizayn sisteminin React ilə hazırlanması.', ['react', 'ts', 'css']], ['Junior Web Developer', 'Webline Studio', 2019, 2021, 'Landing səhifələr və CMS inteqrasiyası.', ['html', 'css', 'js']]],
    edu: [['bachelor', 'Computer Science', 'Azərbaycan Texniki Universiteti', 2019]], certs: [['Meta Front-End Developer', 'Meta', 2022]], langs: [['az', 5], ['en', 4], ['ru', 3]], gh: ['aysel-dev', 28, 143, ['TypeScript', 'CSS', 'JavaScript']], portfolio: 'https://aysel.design', created: '2024-02-11' }),
  mk({ id: 'c2', name: 'Rəşad Hüseynov', email: 'rashad.h@mail.az', phone: '+994 55 874 10 22', location: 'Bakı', title: 'Senior Full-Stack Engineer', summary: 'Yüksək yüklü veb sistemlər və mikroservis arxitekturası üzrə 8 illik təcrübə.', hue: 40,
    skills: [['js', 5], ['ts', 5], ['react', 5], ['node', 5], ['sql', 4], ['docker', 4], ['aws', 4], ['rest', 5], ['git', 5], ['testing', 4], ['lead', 4], ['comm', 4], ['problem', 5], ['team', 4]],
    exp: [['Senior Full-Stack Engineer', 'Kapital Bank Digital', 2019, null, 'Mobil bank API-lərinin və admin portalının inkişafı.', ['node', 'ts', 'react', 'aws']], ['Software Engineer', 'Azercell', 2016, 2019, 'Mikroservis miqrasiyası, SQL optimizasiya.', ['node', 'sql', 'docker']]],
    edu: [['master', 'Software Engineering', 'ADA Universiteti', 2016]], certs: [['AWS Certified Developer', 'Amazon', 2021]], langs: [['az', 5], ['en', 5], ['ru', 4]], gh: ['rashad-h', 54, 612, ['TypeScript', 'Go', 'JavaScript']], portfolio: 'https://rashad.dev', created: '2024-01-20' }),
  mk({ id: 'c3', name: 'Nigar Əliyeva', email: 'nigar.aliyeva@mail.az', phone: '+994 51 220 76 19', location: 'Gəncə', title: 'Data Scientist', summary: 'Proqnozlaşdırma modelləri və biznes analitikası üzrə mütəxəssis.', hue: 280,
    skills: [['python', 5], ['ml', 4], ['da', 5], ['sql', 4], ['git', 3], ['comm', 4], ['problem', 5], ['creative', 3], ['time', 4]],
    exp: [['Data Scientist', 'Azersun Holding', 2020, null, 'Satış proqnozu və müştəri seqmentasiyası modelləri.', ['python', 'ml', 'da']], ['Data Analyst', 'Bakcell', 2018, 2020, 'KPI hesabatları və SQL data mart.', ['sql', 'da']]],
    edu: [['master', 'Applied Mathematics', 'Bakı Dövlət Universiteti', 2018]], certs: [['TensorFlow Developer', 'Google', 2021], ['Google Data Analytics', 'Google', 2020]], langs: [['az', 5], ['en', 5], ['ru', 4]], gh: ['nigar-ds', 31, 205, ['Python', 'Jupyter Notebook']], portfolio: 'https://nigar.ai', created: '2024-03-02' }),
  mk({ id: 'c4', name: 'Elvin Quliyev', email: 'elvin.q@mail.az', phone: '+994 70 455 31 90', location: 'Bakı', title: 'Java Backend Developer', summary: 'Maliyyə sektoru üçün etibarlı backend servislərinin hazırlanması.', hue: 20,
    skills: [['java', 5], ['sql', 4], ['rest', 4], ['docker', 3], ['git', 4], ['testing', 3], ['team', 4], ['problem', 4], ['time', 4]],
    exp: [['Java Developer', 'IBA Tech', 2018, null, 'Spring Boot əsaslı ödəniş servisləri.', ['java', 'sql', 'rest']], ['Junior Developer', 'Azintelecom', 2016, 2018, 'Daxili alətlərin dəstəyi.', ['java']]],
    edu: [['bachelor', 'Information Technologies', 'Bakı Mühəndislik Universiteti', 2016]], certs: [['Oracle Certified Professional Java SE', 'Oracle', 2019]], langs: [['az', 5], ['en', 3], ['ru', 4]], gh: ['elvin-java', 17, 66, ['Java', 'Kotlin']], portfolio: '', created: '2024-01-08' }),
  mk({ id: 'c5', name: 'Səbinə Rzayeva', email: 'sabina.r@mail.az', phone: '+994 55 601 18 44', location: 'Bakı', title: 'UI/UX Designer', summary: 'İstifadəçi araşdırması və məhsul dizaynı üzrə yaradıcı dizayner.', hue: 320,
    skills: [['figma', 5], ['uiux', 5], ['css', 3], ['html', 3], ['creative', 5], ['comm', 5], ['team', 4], ['adapt', 4]],
    exp: [['Product Designer', 'Kontakt Home', 2020, null, 'E-ticarət tətbiqinin UX yenidən dizaynı.', ['figma', 'uiux']], ['Graphic Designer', 'Brandlab', 2018, 2020, 'Brend kimliyi layihələri.', ['figma']]],
    edu: [['bachelor', 'Graphic Design', 'Azərbaycan Dövlət İncəsənət Akademiyası', 2018]], certs: [['Google UX Design', 'Google', 2021]], langs: [['az', 5], ['en', 4], ['ru', 3]], gh: null, portfolio: 'https://sabina.design', created: '2024-02-25' }),
  mk({ id: 'c6', name: 'Tural Nəbiyev', email: 'tural.n@mail.az', phone: '+994 50 733 90 14', location: 'Sumqayıt', title: 'Junior Frontend Developer', summary: 'Bootcamp məzunu, React və TypeScript öyrənməyə davam edir.', hue: 120,
    skills: [['html', 4], ['css', 4], ['js', 3], ['react', 2], ['git', 3], ['comm', 3], ['team', 4], ['adapt', 4]],
    exp: [['Frontend Intern', 'Digital Umbrella', 2023, 2024, 'Landing və admin komponentləri.', ['html', 'css', 'js']]],
    edu: [['bachelor', 'Computer Engineering', 'Sumqayıt Dövlət Universiteti', 2023]], certs: [], langs: [['az', 5], ['en', 3], ['ru', 3]], gh: ['tural-nb', 12, 9, ['JavaScript', 'HTML']], portfolio: 'https://tural.dev', created: '2024-04-01' }),
  mk({ id: 'c7', name: 'Günay Səmədova', email: 'gunay.s@mail.az', phone: '+994 51 988 07 63', location: 'Bakı', title: 'Project Manager', summary: 'Agile komandalarla rəqəmsal məhsulların çatdırılması üzrə layihə meneceri.', hue: 200,
    skills: [['pm', 5], ['lead', 4], ['comm', 5], ['team', 5], ['time', 5], ['problem', 4], ['da', 2]],
    exp: [['Project Manager', 'Rabita Bank', 2018, null, '12 nəfərlik məhsul komandasının idarəsi.', ['pm', 'lead']], ['Business Analyst', 'PASHA Insurance', 2015, 2018, 'Tələblərin toplanması və analizi.', ['da']]],
    edu: [['master', 'Business Administration', 'UNEC', 2015]], certs: [['PMP', 'PMI', 2019]], langs: [['az', 5], ['en', 5], ['ru', 5]], gh: null, portfolio: '', created: '2024-02-14' }),
  mk({ id: 'c8', name: 'Orxan Cəfərov', email: 'orkhan.j@mail.az', phone: '+994 77 210 55 31', location: 'Bakı', title: 'DevOps Engineer', summary: 'CI/CD, konteyner və bulud infrastrukturu üzrə mühəndis.', hue: 160,
    skills: [['docker', 5], ['aws', 5], ['git', 5], ['python', 3], ['node', 2], ['testing', 3], ['problem', 5], ['team', 4], ['adapt', 5]],
    exp: [['DevOps Engineer', 'Azerbaijan Airlines IT', 2019, null, 'Kubernetes klasterləri və pipeline avtomatlaşdırması.', ['docker', 'aws', 'git']], ['Systems Administrator', 'Delta Telecom', 2016, 2019, 'Linux serverlərin idarəsi.', ['python']]],
    edu: [['bachelor', 'Computer Science', 'Xəzər Universiteti', 2016]], certs: [['AWS Certified Developer', 'Amazon', 2020]], langs: [['az', 5], ['en', 4], ['ru', 4]], gh: ['orkhan-ops', 39, 188, ['Shell', 'Python', 'HCL']], portfolio: '', created: '2024-01-30' }),
  mk({ id: 'c9', name: 'Leyla Əhmədova', email: 'leyla.a@mail.az', phone: '+994 55 140 28 77', location: 'Bakı', title: 'React Developer', summary: 'E-ticarət və fintech məhsulları üzrə React tərtibatçısı.', hue: 350,
    skills: [['html', 5], ['css', 5], ['js', 5], ['ts', 4], ['react', 5], ['rest', 4], ['git', 4], ['testing', 4], ['figma', 3], ['comm', 4], ['team', 4], ['problem', 4]],
    exp: [['React Developer', 'Birbank', 2020, null, 'Mobil veb tətbiqin komponent kitabxanası.', ['react', 'ts', 'testing']], ['Frontend Developer', 'Kontakt Home', 2018, 2020, 'E-ticarət vitrini.', ['js', 'css', 'html']]],
    edu: [['bachelor', 'Computer Science', 'ADA Universiteti', 2018]], certs: [['Meta Front-End Developer', 'Meta', 2021]], langs: [['az', 5], ['en', 5], ['ru', 3]], gh: ['leyla-react', 36, 321, ['TypeScript', 'JavaScript']], portfolio: 'https://leyla.codes', created: '2024-03-12' }),
  mk({ id: 'c10', name: 'Kamran Rüstəmov', email: 'kamran.r@mail.az', phone: '+994 50 902 44 15', location: 'Bakı', title: 'Machine Learning Engineer', summary: 'NLP və computer vision modellərinin istehsala çıxarılması.', hue: 250,
    skills: [['python', 5], ['ml', 5], ['da', 4], ['sql', 3], ['docker', 3], ['git', 4], ['aws', 3], ['problem', 5], ['creative', 4], ['comm', 3]],
    exp: [['ML Engineer', 'Azercosmos', 2021, null, 'Peyk görüntüləri üçün sinifləndirmə modelləri.', ['python', 'ml', 'docker']], ['Research Assistant', 'ANAS', 2019, 2021, 'NLP tədqiqatı.', ['python', 'ml']]],
    edu: [['master', 'Artificial Intelligence', 'ADA Universiteti', 2021], ['bachelor', 'Mathematics', 'BDU', 2019]], certs: [['TensorFlow Developer', 'Google', 2022]], langs: [['az', 5], ['en', 5], ['ru', 3]], gh: ['kamran-ml', 44, 477, ['Python', 'Jupyter Notebook', 'C++']], portfolio: 'https://kamran.ai', created: '2024-02-03' }),
  mk({ id: 'c11', name: 'Fidan Məlikova', email: 'fidan.m@mail.az', phone: '+994 51 366 90 02', location: 'Şəki', title: 'QA Engineer', summary: 'Avtomatlaşdırılmış test və keyfiyyət prosesləri üzrə mühəndis.', hue: 95,
    skills: [['testing', 5], ['js', 3], ['sql', 3], ['git', 3], ['rest', 3], ['comm', 4], ['time', 4], ['problem', 4], ['team', 4]],
    exp: [['QA Engineer', 'Pasha Holding', 2020, null, 'Cypress ilə e2e test paketləri.', ['testing', 'js']], ['Manual Tester', 'Softline', 2018, 2020, 'Regression və acceptance testlər.', ['testing']]],
    edu: [['bachelor', 'Information Systems', 'Azərbaycan Dövlət İqtisad Universiteti', 2018]], certs: [], langs: [['az', 5], ['en', 4], ['ru', 4]], gh: ['fidan-qa', 14, 22, ['JavaScript']], portfolio: '', created: '2024-03-20' }),
  mk({ id: 'c12', name: 'Vüsal Babayev', email: 'vusal.b@mail.az', phone: '+994 70 118 63 90', location: 'Bakı', title: 'Backend Developer (Node.js)', summary: 'REST API və real-time sistemlər üzrə Node.js tərtibatçısı.', hue: 60,
    skills: [['js', 4], ['ts', 4], ['node', 5], ['rest', 5], ['sql', 4], ['docker', 3], ['git', 4], ['testing', 3], ['team', 4], ['problem', 4], ['time', 3]],
    exp: [['Backend Developer', 'Yelo Bank', 2020, null, 'Node.js mikroservisləri və PostgreSQL.', ['node', 'ts', 'sql', 'rest']], ['Junior Node Developer', 'Code Academy', 2018, 2020, 'Daxili API-lər.', ['node', 'js']]],
    edu: [['bachelor', 'Computer Science', 'Azərbaycan Texniki Universiteti', 2018]], certs: [], langs: [['az', 5], ['en', 4], ['ru', 4]], gh: ['vusal-node', 25, 98, ['TypeScript', 'JavaScript']], portfolio: 'https://vusal.dev', created: '2024-02-18' }),
  mk({ id: 'c13', name: 'Ləman Hacıyeva', email: 'laman.h@mail.az', phone: '+994 55 220 48 31', location: 'Bakı', title: 'Business Data Analyst', summary: 'SQL və BI alətləri ilə biznes qərarlarını dəstəkləyən analitik.', hue: 180,
    skills: [['da', 5], ['sql', 5], ['python', 3], ['comm', 4], ['time', 5], ['problem', 4], ['team', 4]],
    exp: [['Data Analyst', 'Azərişıq', 2019, null, 'İstehlak məlumatlarının hesabatlandırılması.', ['da', 'sql']]],
    edu: [['bachelor', 'Statistics', 'UNEC', 2019]], certs: [['Google Data Analytics', 'Google', 2021]], langs: [['az', 5], ['en', 4], ['ru', 4]], gh: null, portfolio: '', created: '2024-03-27' }),
  mk({ id: 'c14', name: 'Samir Allahverdiyev', email: 'samir.a@mail.az', phone: '+994 50 640 11 05', location: 'Bakı', title: 'Tech Lead', summary: 'Komanda və arxitektura rəhbəri; frontend və backend sistemlərdə geniş təcrübə.', hue: 10,
    skills: [['js', 5], ['ts', 5], ['react', 4], ['node', 5], ['java', 3], ['sql', 4], ['docker', 4], ['aws', 4], ['git', 5], ['rest', 5], ['testing', 4], ['lead', 5], ['comm', 5], ['pm', 4], ['problem', 5], ['team', 5]],
    exp: [['Tech Lead', 'Kapital Bank Digital', 2018, null, '15 mühəndisdən ibarət platforma komandası.', ['node', 'react', 'aws', 'lead']], ['Senior Developer', 'Azercell', 2013, 2018, 'Mikroservis arxitekturası.', ['java', 'sql', 'node']]],
    edu: [['master', 'Computer Science', 'ADA Universiteti', 2013]], certs: [['AWS Certified Developer', 'Amazon', 2019], ['PMP', 'PMI', 2020]], langs: [['az', 5], ['en', 5], ['ru', 5]], gh: ['samir-lead', 62, 891, ['TypeScript', 'Java', 'Go']], portfolio: 'https://samir.tech', created: '2024-01-12' }),
]

const rq = (skillId: string, level: number, mandatory = false): Requirement => ({ skillId, level, mandatory })

export const SEED_VACANCIES: Vacancy[] = [
  { id: 'v1', title: 'Senior React Developer', company: 'Nexora Labs', description: 'Fintech məhsulumuzun veb platformasını inkişaf etdirəcək, komandaya mentorluq edəcək senior React mühəndisi axtarırıq. Performans, əlçatanlıq və test mədəniyyəti vacibdir.', type: 'full-time', seniority: 'senior', location: 'Bakı', minExperience: 5, minEducation: 'bachelor', fields: ['Computer', 'Software', 'Information'],
    requirements: [rq('react', 4, true), rq('ts', 4, true), rq('js', 4), rq('css', 3), rq('testing', 3), rq('git', 3), rq('comm', 3), rq('team', 3)], certs: ['cert-meta'], languages: [{ lang: 'en', level: 4 }, { lang: 'az', level: 5 }], status: 'active', createdAt: '2024-04-02', salary: '3500–5000 AZN' },
  { id: 'v2', title: 'Frontend Developer', company: 'Nexora Labs', description: 'Müasir dizayn sistemi üzərində işləyəcək frontend developer. React və TypeScript təcrübəsi üstünlükdür.', type: 'full-time', seniority: 'mid', location: 'Bakı', minExperience: 2, minEducation: 'bachelor', fields: ['Computer', 'Information'],
    requirements: [rq('html', 4, true), rq('css', 4, true), rq('js', 3, true), rq('react', 3), rq('git', 3), rq('figma', 2), rq('team', 3)], certs: [], languages: [{ lang: 'en', level: 3 }, { lang: 'az', level: 5 }], status: 'active', createdAt: '2024-04-05', salary: '1800–2800 AZN' },
  { id: 'v3', title: 'Data Scientist', company: 'Atlas Analytics', description: 'Proqnozlaşdırma və tövsiyə sistemləri üzərində işləyəcək data scientist. Python, ML və SQL biliyi mütləqdir.', type: 'full-time', seniority: 'mid', location: 'Bakı', minExperience: 3, minEducation: 'master', fields: ['Math', 'Statistics', 'Computer', 'Intelligence'],
    requirements: [rq('python', 4, true), rq('ml', 4, true), rq('da', 4), rq('sql', 3, true), rq('problem', 4), rq('comm', 3)], certs: ['cert-tf'], languages: [{ lang: 'en', level: 4 }, { lang: 'az', level: 5 }], status: 'active', createdAt: '2024-04-08', salary: '3000–4500 AZN' },
  { id: 'v4', title: 'Java Backend Engineer', company: 'Caspian Systems', description: 'Bank sistemləri üçün yüksək etibarlı backend servislərinin inkişafı.', type: 'full-time', seniority: 'senior', location: 'Bakı', minExperience: 5, minEducation: 'bachelor', fields: ['Computer', 'Information', 'Software'],
    requirements: [rq('java', 4, true), rq('sql', 4, true), rq('rest', 4), rq('docker', 3), rq('git', 3), rq('testing', 3), rq('problem', 4)], certs: ['cert-oracle'], languages: [{ lang: 'en', level: 3 }, { lang: 'az', level: 5 }], status: 'active', createdAt: '2024-04-10', salary: '3200–4800 AZN' },
  { id: 'v5', title: 'Product Designer (UI/UX)', company: 'Studio Orbit', description: 'Mobil və veb məhsullar üçün istifadəçi təcrübəsini dizayn edəcək dizayner.', type: 'remote', seniority: 'mid', location: 'Remote', minExperience: 2, minEducation: 'bachelor', fields: ['Design', 'Art', 'Computer'],
    requirements: [rq('figma', 4, true), rq('uiux', 4, true), rq('css', 2), rq('creative', 4), rq('comm', 4), rq('team', 3)], certs: ['cert-ux'], languages: [{ lang: 'en', level: 4 }], status: 'active', createdAt: '2024-04-12', salary: '2000–3200 AZN' },
  { id: 'v6', title: 'DevOps Engineer', company: 'Caspian Systems', description: 'CI/CD pipeline-ların və bulud infrastrukturunun qurulması və dəstəyi.', type: 'full-time', seniority: 'senior', location: 'Bakı', minExperience: 4, minEducation: 'bachelor', fields: ['Computer', 'Information', 'Engineering'],
    requirements: [rq('docker', 4, true), rq('aws', 4, true), rq('git', 4), rq('python', 3), rq('problem', 4), rq('adapt', 3)], certs: ['cert-aws'], languages: [{ lang: 'en', level: 4 }, { lang: 'az', level: 5 }], status: 'active', createdAt: '2024-04-14', salary: '3300–5000 AZN' },
  { id: 'v7', title: 'Node.js Backend Developer', company: 'Atlas Analytics', description: 'Real-time məlumat platformasının API qatını qurmaq.', type: 'full-time', seniority: 'mid', location: 'Bakı', minExperience: 3, minEducation: 'bachelor', fields: ['Computer', 'Information'],
    requirements: [rq('node', 4, true), rq('ts', 3), rq('rest', 4, true), rq('sql', 3), rq('docker', 2), rq('git', 3), rq('team', 3)], certs: [], languages: [{ lang: 'en', level: 3 }], status: 'closed', createdAt: '2024-03-01', salary: '2500–3800 AZN' },
]

export const SEED_APPLICATIONS: Application[] = [
  { id: 'a1', candidateId: 'c1', vacancyId: 'v2', date: '2024-04-18', status: 'review' },
  { id: 'a2', candidateId: 'c9', vacancyId: 'v1', date: '2024-04-16', status: 'interview' },
  { id: 'a3', candidateId: 'c2', vacancyId: 'v1', date: '2024-04-15', status: 'interview' },
  { id: 'a4', candidateId: 'c14', vacancyId: 'v1', date: '2024-04-17', status: 'review' },
  { id: 'a5', candidateId: 'c6', vacancyId: 'v2', date: '2024-04-19', status: 'new' },
  { id: 'a6', candidateId: 'c3', vacancyId: 'v3', date: '2024-04-14', status: 'interview' },
  { id: 'a7', candidateId: 'c10', vacancyId: 'v3', date: '2024-04-14', status: 'review' },
  { id: 'a8', candidateId: 'c13', vacancyId: 'v3', date: '2024-04-20', status: 'new' },
  { id: 'a9', candidateId: 'c4', vacancyId: 'v4', date: '2024-04-13', status: 'review' },
  { id: 'a10', candidateId: 'c12', vacancyId: 'v4', date: '2024-04-18', status: 'new' },
  { id: 'a11', candidateId: 'c5', vacancyId: 'v5', date: '2024-04-17', status: 'interview' },
  { id: 'a12', candidateId: 'c8', vacancyId: 'v6', date: '2024-04-19', status: 'review' },
  { id: 'a13', candidateId: 'c2', vacancyId: 'v6', date: '2024-04-21', status: 'new' },
  { id: 'a14', candidateId: 'c11', vacancyId: 'v2', date: '2024-04-21', status: 'new' },
  { id: 'a15', candidateId: 'c1', vacancyId: 'v1', date: '2024-04-22', status: 'new' },
  { id: 'a16', candidateId: 'c12', vacancyId: 'v7', date: '2024-03-12', status: 'rejected' },
]

export function buildSeedDB(): Omit<DB, 'decisions'> & { decisions: DB['decisions'] } {
  return {
    version: 1,
    skills: SEED_SKILLS,
    candidates: SEED_CANDIDATES,
    vacancies: SEED_VACANCIES,
    applications: SEED_APPLICATIONS,
    decisions: [],
    interviewLists: [],
    kb: SEED_KB,
  }
}
