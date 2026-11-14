import type { Lang } from '../lib/types'

type Q = [string, string, string] // az, en, ru
type Tier = [Q, Q, Q] // basic, practical, advanced

const IDX: Record<Lang, number> = { az: 0, en: 1, ru: 2 }

export const QUESTION_BANK: Record<string, Tier> = {
  html: [
    ['HTML-də semantik elementlər nə üçün vacibdir? Üç nümunə verin.', 'Why do semantic elements matter in HTML? Give three examples.', 'Почему важны семантические элементы HTML? Приведите три примера.'],
    ['Əlçatan (accessible) bir form necə qurarsınız? Label, aria və klaviatura naviqasiyası haqqında danışın.', 'How would you build an accessible form? Talk about labels, aria and keyboard navigation.', 'Как построить доступную форму? Расскажите о label, aria и навигации с клавиатуры.'],
    ['Səhifənin SEO və performansını HTML səviyyəsində necə yaxşılaşdırarsınız?', 'How would you improve SEO and performance of a page at the HTML level?', 'Как улучшить SEO и производительность страницы на уровне HTML?'],
  ],
  css: [
    ['Box model nədir və margin ilə padding arasındakı fərq nədir?', 'What is the box model and how do margin and padding differ?', 'Что такое блочная модель и чем margin отличается от padding?'],
    ['Flexbox ilə Grid-i nə zaman seçərsiniz? Real nümunə göstərin.', 'When would you choose Flexbox over Grid? Give a real example.', 'Когда вы выберете Flexbox, а когда Grid? Приведите пример.'],
    ['Böyük layihədə CSS arxitekturasını (BEM, utility, CSS-in-JS) necə qurarsınız?', 'How would you architect CSS in a large project (BEM, utility-first, CSS-in-JS)?', 'Как выстроить архитектуру CSS в большом проекте (BEM, utility, CSS-in-JS)?'],
  ],
  js: [
    ['let, const və var arasındakı fərqi izah edin.', 'Explain the difference between let, const and var.', 'Объясните разницу между let, const и var.'],
    ['Promise, async/await və event loop necə işləyir? Nümunə ilə izah edin.', 'How do Promises, async/await and the event loop work? Explain with an example.', 'Как работают Promise, async/await и event loop? Объясните на примере.'],
    ['Yaddaş sızıntısını (memory leak) necə aşkar edib aradan qaldırarsınız?', 'How would you detect and fix a memory leak in a JavaScript app?', 'Как обнаружить и устранить утечку памяти в JavaScript-приложении?'],
  ],
  ts: [
    ['TypeScript-in JavaScript-dən əsas üstünlükləri nələrdir?', 'What are the main advantages of TypeScript over JavaScript?', 'Каковы основные преимущества TypeScript перед JavaScript?'],
    ['Generics nədir? Təkrar istifadə olunan tipli funksiya yazın.', 'What are generics? Write a reusable typed function.', 'Что такое generics? Напишите переиспользуемую типизированную функцию.'],
    ['Conditional və mapped tiplərdən istifadə edərək mürəkkəb tip problemi necə həll edərsiniz?', 'How would you solve a complex typing problem using conditional and mapped types?', 'Как решить сложную задачу типизации с помощью conditional и mapped типов?'],
  ],
  react: [
    ['useState və useEffect hook-ları nə üçün istifadə olunur?', 'What are useState and useEffect used for?', 'Для чего используются useState и useEffect?'],
    ['Lazımsız re-render-ləri necə aşkar edib azaldarsınız? (memo, useMemo, useCallback)', 'How do you find and reduce unnecessary re-renders? (memo, useMemo, useCallback)', 'Как найти и уменьшить лишние перерендеры? (memo, useMemo, useCallback)'],
    ['Böyük React tətbiqində state idarəetməsini və kod bölgüsünü necə qurarsınız?', 'How would you structure state management and code splitting in a large React app?', 'Как организовать управление состоянием и разделение кода в большом React-приложении?'],
  ],
  node: [
    ['Node.js-in single-thread modeli necə işləyir?', 'How does the Node.js single-thread model work?', 'Как работает однопоточная модель Node.js?'],
    ['Express/Fastify-da middleware və xəta idarəetməsini necə qurursunuz?', 'How do you build middleware and error handling in Express/Fastify?', 'Как строить middleware и обработку ошибок в Express/Fastify?'],
    ['Yüksək yüklü Node.js servisini necə miqyaslandırarsınız?', 'How would you scale a high-load Node.js service?', 'Как масштабировать высоконагруженный сервис на Node.js?'],
  ],
  python: [
    ['Python-da list, tuple və dict arasındakı fərqlər nələrdir?', 'What are the differences between list, tuple and dict in Python?', 'Чем отличаются list, tuple и dict в Python?'],
    ['Generator və decorator nədir? Praktik nümunə göstərin.', 'What are generators and decorators? Show a practical example.', 'Что такое генераторы и декораторы? Приведите практический пример.'],
    ['Böyük verilənləri Python ilə yaddaşa sığdırmadan necə emal edərsiniz?', 'How would you process data larger than memory with Python?', 'Как обработать данные, не помещающиеся в память, с помощью Python?'],
  ],
  java: [
    ['Java-da OOP-nin dörd əsas prinsipini izah edin.', 'Explain the four core OOP principles in Java.', 'Объясните четыре основных принципа ООП в Java.'],
    ['Spring Boot-da dependency injection necə işləyir?', 'How does dependency injection work in Spring Boot?', 'Как работает внедрение зависимостей в Spring Boot?'],
    ['JVM-də garbage collection-u və performans tənzimləməsini izah edin.', 'Explain garbage collection and performance tuning on the JVM.', 'Объясните сборку мусора и настройку производительности JVM.'],
  ],
  sql: [
    ['INNER JOIN ilə LEFT JOIN arasındakı fərq nədir?', 'What is the difference between INNER JOIN and LEFT JOIN?', 'Чем INNER JOIN отличается от LEFT JOIN?'],
    ['Yavaş işləyən sorğunu necə analiz edib optimallaşdırarsınız? (index, EXPLAIN)', 'How would you analyse and optimise a slow query? (indexes, EXPLAIN)', 'Как проанализировать и оптимизировать медленный запрос? (индексы, EXPLAIN)'],
    ['Tranzaksiya izolyasiya səviyyələrini və deadlock hallarını izah edin.', 'Explain transaction isolation levels and deadlocks.', 'Объясните уровни изоляции транзакций и взаимные блокировки.'],
  ],
  git: [
    ['merge ilə rebase arasındakı fərq nədir?', 'What is the difference between merge and rebase?', 'Чем merge отличается от rebase?'],
    ['Merge konfliktini necə həll edirsiniz? Addımlarla izah edin.', 'How do you resolve a merge conflict? Walk through the steps.', 'Как вы решаете конфликт слияния? Опишите шаги.'],
    ['Komanda üçün branching strategiyası (trunk-based, GitFlow) necə seçərsiniz?', 'How would you choose a branching strategy (trunk-based, GitFlow) for a team?', 'Как выбрать стратегию ветвления (trunk-based, GitFlow) для команды?'],
  ],
  docker: [
    ['Image ilə container arasındakı fərq nədir?', 'What is the difference between an image and a container?', 'Чем образ (image) отличается от контейнера?'],
    ['Multi-stage Dockerfile nə üçün istifadə olunur? Nümunə yazın.', 'Why use a multi-stage Dockerfile? Write an example.', 'Зачем нужен multi-stage Dockerfile? Напишите пример.'],
    ['Konteynerləri istehsalda orkestrasiya (Kubernetes) və monitorinq baxımından necə idarə edərsiniz?', 'How would you orchestrate (Kubernetes) and monitor containers in production?', 'Как оркестрировать (Kubernetes) и мониторить контейнеры в продакшене?'],
  ],
  comm: [
    ['Texniki olmayan şəxsə mürəkkəb mövzunu necə izah edirsiniz? Nümunə verin.', 'How do you explain a complex topic to a non-technical person? Give an example.', 'Как вы объясняете сложную тему нетехническому человеку? Приведите пример.'],
    ['Komanda ilə fikir ayrılığı yaşadığınız bir halı və onu necə həll etdiyinizi danışın.', 'Describe a disagreement with your team and how you resolved it.', 'Расскажите о разногласии в команде и о том, как вы его разрешили.'],
    ['Maraqlı tərəflər arasında ziddiyyətli tələbləri necə uzlaşdırırsınız?', 'How do you reconcile conflicting requirements between stakeholders?', 'Как вы согласуете противоречивые требования заинтересованных сторон?'],
  ],
  team: [
    ['Komandada ən yaxşı işlədiyiniz rol hansıdır və niyə?', 'Which role do you play best in a team and why?', 'Какую роль вы лучше всего выполняете в команде и почему?'],
    ['Komanda üzvü öz öhdəliyini yerinə yetirmədikdə nə edirsiniz?', 'What do you do when a teammate does not deliver on their commitment?', 'Что вы делаете, если коллега не выполняет свои обязательства?'],
    ['Paylanmış (remote) komandada əməkdaşlığı necə təşkil edirsiniz?', 'How do you organise collaboration in a distributed (remote) team?', 'Как вы организуете сотрудничество в распределённой (удалённой) команде?'],
  ],
  lead: [
    ['Sizin üçün yaxşı liderin əsas keyfiyyətləri nələrdir?', 'What qualities make a good leader in your view?', 'Какие качества, по-вашему, делают лидера хорошим?'],
    ['Komanda üzvünə mentorluq etdiyiniz və nəticə əldə etdiyiniz halı danışın.', 'Describe a time you mentored a team member and achieved a result.', 'Расскажите, как вы наставляли коллегу и добились результата.'],
    ['Çətin qərarı natamam məlumatla necə qəbul edirsiniz və komandaya necə çatdırırsınız?', 'How do you make a difficult decision with incomplete information and communicate it?', 'Как вы принимаете сложное решение при неполной информации и доносите его до команды?'],
  ],
  problem: [
    ['Son zamanlar həll etdiyiniz çətin problemi və yanaşmanızı danışın.', 'Describe a hard problem you solved recently and your approach.', 'Расскажите о сложной проблеме, которую вы недавно решили, и вашем подходе.'],
    ['Səbəbi bəlli olmayan production xətasını necə araşdırırsınız?', 'How do you investigate a production bug with an unknown cause?', 'Как вы расследуете ошибку в продакшене с неизвестной причиной?'],
    ['Qeyri-müəyyən tələblərlə problemi necə strukturlaşdırırsınız?', 'How do you structure a problem with ambiguous requirements?', 'Как вы структурируете задачу с неопределёнными требованиями?'],
  ],
  time: [
    ['Gündəlik tapşırıqlarınıza necə prioritet verirsiniz?', 'How do you prioritise your daily tasks?', 'Как вы расставляете приоритеты в ежедневных задачах?'],
    ['Eyni anda bir neçə son tarix yaxınlaşanda nə edirsiniz?', 'What do you do when several deadlines converge?', 'Что вы делаете, когда сходятся сразу несколько дедлайнов?'],
    ['Komandanın vaxt qiymətləndirmələrini (estimation) necə daha dəqiq edərsiniz?', 'How would you make your team’s time estimates more accurate?', 'Как сделать оценки сроков в команде более точными?'],
  ],
}

const TEMPLATES: Record<'technical' | 'soft', Tier> = {
  technical: [
    ['{skill} üzrə əsas anlayışları öz sözlərinizlə izah edin.', 'Explain the core concepts of {skill} in your own words.', 'Объясните основные понятия {skill} своими словами.'],
    ['{skill} istifadə etdiyiniz real layihəni və qarşılaşdığınız çətinliyi danışın.', 'Describe a real project where you used {skill} and a challenge you faced.', 'Расскажите о реальном проекте с {skill} и о трудности, с которой вы столкнулись.'],
    ['{skill} üzrə ən yaxşı təcrübələri və tipik səhvləri müzakirə edin.', 'Discuss best practices and common pitfalls in {skill}.', 'Обсудите лучшие практики и типичные ошибки в {skill}.'],
  ],
  soft: [
    ['{skill} sizin üçün nə deməkdir?', 'What does {skill} mean to you?', 'Что для вас значит {skill}?'],
    ['{skill} bacarığını nümayiş etdirdiyiniz konkret bir situasiyanı (STAR) danışın.', 'Describe a specific situation (STAR) where you demonstrated {skill}.', 'Расскажите о конкретной ситуации (STAR), где вы проявили {skill}.'],
    ['{skill} bacarığınızı necə inkişaf etdirirsiniz?', 'How do you keep developing your {skill}?', 'Как вы развиваете навык {skill}?'],
  ],
}

export type QKind = 'gap' | 'improve' | 'verify'
const TIER: Record<QKind, number> = { gap: 0, improve: 1, verify: 2 }

export function questionFor(skillId: string, skillName: string, category: string, kind: QKind, lang: Lang): string {
  const tier = QUESTION_BANK[skillId] ?? TEMPLATES[category === 'soft' ? 'soft' : 'technical']
  return tier[TIER[kind]][IDX[lang]].split('{skill}').join(skillName)
}

export const GENERAL_QUESTIONS: Q[] = [
  ['Niyə məhz bu vakansiyaya müraciət etmisiniz?', 'Why did you apply for this particular role?', 'Почему вы откликнулись именно на эту вакансию?'],
  ['Növbəti 2 ildə karyeranızı necə görürsünüz?', 'Where do you see your career in the next two years?', 'Как вы видите свою карьеру в ближайшие два года?'],
  ['Yeni texnologiyanı sürətlə öyrənməli olduğunuz bir halı danışın.', 'Tell us about a time you had to learn a new technology quickly.', 'Расскажите, как вам приходилось быстро осваивать новую технологию.'],
]
export const generalQuestion = (i: number, lang: Lang) => GENERAL_QUESTIONS[i][IDX[lang]]
