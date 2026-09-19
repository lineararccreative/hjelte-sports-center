/* =====================================================================
   Hjelte Sports Center — Spanish translation layer
   ---------------------------------------------------------------------
   The page is authored and rendered in English. When the visitor picks
   Español, every text node, placeholder, title and aria-label whose
   English text is a key in ES below is swapped for the Spanish value
   (whitespace preserved). A MutationObserver keeps newly rendered
   content translated. Switching back restores the originals.

   Content admins type (group descriptions, updates, project text) shows
   in Spanish only when a *_es field exists; otherwise English.
   To add or fix a phrase: put the exact English text on the left.
   ===================================================================== */
(function () {
  "use strict";
  const KEY = "hjelte-lang";
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || (function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } })() || "en";
  if (lang !== "es") lang = "en";

  const ES = {
    "Community Sports Hub": "Centro Deportivo Comunitario", "Explore": "Explorar", "Sports": "Deportes", "Schedule": "Horario", "Groups": "Grupos", "Facility": "Instalaciones", "Projects": "Proyectos", "Get Involved": "Participa", "Connect": "Contacto", "Updates": "Novedades", "View Schedule": "Ver horario", "Skip to content": "Saltar al contenido", "Open menu": "Abrir menú", "Close menu": "Cerrar menú", "Back to top": "Volver arriba", "Admin sign-in": "Acceso de administradores",
    "Encino · Sepulveda Basin · Los Angeles": "Encino · Cuenca de Sepulveda · Los Ángeles", "Where Encino Plays": "Donde Encino juega",
    "A shared home for sport, recreation, competition and community. Explore the teams, organizations, programs and people who use Hjelte Sports Center — and discover ways to participate, collaborate and help improve the facility.": "Un hogar compartido para el deporte, la recreación, la competencia y la comunidad. Conoce los equipos, organizaciones, programas y personas que usan Hjelte Sports Center, y descubre cómo participar, colaborar y ayudar a mejorar las instalaciones.",
    "Explore the Complex": "Explorar el complejo", "Are you part of a group that plays here? Add your group →": "¿Formas parte de un grupo que juega aquí? Agrega tu grupo →",
    "Sport Categories": "Categorías deportivas", "Community Programs": "Programas comunitarios", "Youth & Adult": "Jóvenes y adultos", "Activities": "Actividades", "Permitted & Open": "Con permiso y abierto", "Recreation": "Recreación", "Year-Round": "Todo el año", "Use": "Uso",
    "About Hjelte": "Sobre Hjelte", "One Complex.": "Un complejo.", "Many Communities.": "Muchas comunidades.",
    "Hjelte Sports Center is a multi-use athletic facility in the Sepulveda Basin supporting organized sports, leagues, youth programs, independent athletes, informal groups, recreation and community activities — all sharing the same fields, paths and open turf.": "Hjelte Sports Center es una instalación deportiva de usos múltiples en la Cuenca de Sepulveda que acoge deportes organizados, ligas, programas juveniles, atletas independientes, grupos informales, recreación y actividades comunitarias, todos compartiendo los mismos campos, senderos y césped abierto.",
    "Softball fields": "Campos de sóftbol", "Baseball activity": "Béisbol", "Cricket": "Críquet", "Soccer": "Fútbol", "Disc sports": "Deportes de disco", "Training": "Entrenamiento", "Community events": "Eventos comunitarios", "Explore the Facility": "Explorar las instalaciones", "Illustrated overview · not to scale": "Vista ilustrada · sin escala",
    "Sports at Hjelte": "Deportes en Hjelte", "What Happens Here": "Qué se juega aquí", "Nine categories of activity share one complex. Tap a card to see typical activities and the groups behind them.": "Nueve categorías de actividad comparten un solo complejo. Toca una tarjeta para ver actividades típicas y los grupos detrás de ellas.",
    "Baseball": "Béisbol", "Softball": "Sóftbol", "Disc / Frisbee Sports": "Disco / Frisbee", "Fitness & Training": "Fitness y entrenamiento", "Youth Recreation": "Recreación juvenil", "Community Activities": "Actividades comunitarias", "Other Sports": "Otros deportes",
    "Youth baseball shares the four lighted diamonds with softball programs.": "El béisbol juvenil comparte los cuatro diamantes iluminados con los programas de sóftbol.",
    "One of the busiest activities at the complex — slow-pitch, fast-pitch and co-ed leagues.": "Una de las actividades más concurridas del complejo: ligas de lanzamiento lento, rápido y mixtas.",
    "Home to a natural-turf cricket pitch developed by the community ahead of LA28.": "Sede de un pitch de críquet de césped natural creado por la comunidad rumbo a LA28.",
    "The shared outfield hosts small-sided games, youth training and informal pickup.": "El jardín compartido acoge partidos reducidos, entrenamientos juveniles y juegos informales.",
    "Ultimate and disc pickup on the shared outfield, evenings and weekends.": "Ultimate y disco en el jardín compartido, por las tardes y fines de semana.",
    "Bootcamps, running groups and conditioning sessions along the perimeter road and west lawn.": "Bootcamps, grupos de corredores y acondicionamiento en el camino perimetral y el césped oeste.",
    "Programs and camps that introduce kids to sport in a safe, open setting.": "Programas y campamentos que acercan a los niños al deporte en un entorno seguro y abierto.",
    "Cleanup days, gatherings, cultural celebrations and neighborhood events.": "Jornadas de limpieza, reuniones, celebraciones culturales y eventos vecinales.",
    "Kickball, flag football, lacrosse and whatever the community brings next.": "Kickball, fútbol bandera, lacrosse y lo que la comunidad traiga después.",
    "Team practices": "Entrenamientos de equipo", "League games": "Partidos de liga", "Youth development": "Desarrollo juvenil", "Weekend tournaments": "Torneos de fin de semana", "Adult leagues": "Ligas de adultos", "Co-ed evenings": "Tardes mixtas", "Youth fast-pitch": "Fast-pitch juvenil", "Tournaments": "Torneos", "Youth coaching": "Entrenamiento juvenil", "Net & pitch practice": "Práctica de red y pitch", "Weekend matches": "Partidos de fin de semana", "Community intros": "Sesiones introductorias", "Youth training": "Entrenamiento juvenil", "Pickup games": "Partidos informales", "Skills clinics": "Clínicas de habilidades", "Small-sided leagues": "Ligas de campo reducido", "Ultimate pickup": "Ultimate informal", "League nights": "Noches de liga", "Youth clinics": "Clínicas juveniles", "Throwing practice": "Práctica de lanzamiento", "Morning bootcamps": "Bootcamps matutinos", "Run clubs": "Clubes de corredores", "Conditioning": "Acondicionamiento", "Walking groups": "Grupos de caminata", "Camps": "Campamentos", "After-school programs": "Programas extraescolares", "Multi-sport intros": "Introducción multideporte", "Family days": "Días familiares", "Cleanup days": "Jornadas de limpieza", "Celebrations": "Celebraciones", "Volunteer projects": "Proyectos de voluntariado", "Flag football": "Fútbol bandera", "Rugby touch": "Rugby touch",
    "Explore Groups": "Ver grupos", "See schedule": "Ver horario", "Sport at Hjelte": "Deporte en Hjelte", "Typical activities": "Actividades típicas", "No groups listed yet for this sport.": "Aún no hay grupos para este deporte.", "Add yours →": "Agrega el tuyo →",
    "Today · This Week · Upcoming": "Hoy · Esta semana · Próximamente", "What's Happening at Hjelte": "Qué pasa en Hjelte", "Today": "Hoy", "This Week": "Esta semana", "Upcoming": "Próximamente", "Tomorrow": "Mañana",
    "Nothing scheduled today. Open recreation may still be available; check posted signage.": "No hay nada programado hoy. La recreación abierta puede estar disponible; revisa la señalización.", "No activities this week.": "No hay actividades esta semana.", "No special events posted yet.": "Aún no hay eventos especiales publicados.", "Tell us about one →": "Cuéntanos de uno →", "Sample": "Ejemplo", "Special": "Especial", "now": "ahora",
    "Practice": "Entrenamiento", "Game": "Partido", "League": "Liga", "Youth Program": "Programa juvenil", "Open Recreation": "Recreación abierta", "Community Activity": "Actividad comunitaria", "Tournament": "Torneo", "Maintenance": "Mantenimiento", "Special Event": "Evento especial",
    "Permitted Activity": "Actividad con permiso", "Community / Independent Activity": "Actividad comunitaria / independiente", "Maintenance / Facility Work": "Mantenimiento / obras",
    "Activity associated with an organization or program using the facility during an authorized scheduled period.": "Actividad de una organización o programa que usa las instalaciones durante un periodo autorizado y programado.",
    "Known recurring recreational or informal activity that may occur outside structured permitted programming.": "Actividad recreativa o informal recurrente que puede ocurrir fuera de la programación con permiso.",
    "General community use when applicable.": "Uso general de la comunidad cuando corresponda.", "Scheduled field maintenance or improvement activity.": "Mantenimiento programado o mejoras del campo.",
    "Latest Updates": "Últimas novedades", "Stay in the Loop": "Mantente al día", "Get updates by sport or for everything happening at Hjelte. One email a day at most, only when there is news.": "Recibe novedades por deporte o de todo lo que pasa en Hjelte. Como máximo un correo al día, solo cuando hay noticias.", "Your email": "Tu correo electrónico", "All sports": "Todos los deportes", "Subscribe": "Suscribirme", "Choose at least one sport or All sports.": "Elige al menos un deporte o Todos los deportes.", "Check your inbox to confirm your subscription.": "Revisa tu correo para confirmar la suscripción.", "Subscriptions are handled by the community hub, not the City. Unsubscribe any time from the email footer.": "Las suscripciones las gestiona el centro comunitario, no la Ciudad. Cancela cuando quieras desde el pie del correo.", "No updates yet.": "Aún no hay novedades.", "All": "Todo", "Email updates aren't switched on yet; check back soon.": "Las novedades por correo aún no están activas; vuelve pronto.",
    "Master Facility Schedule": "Horario general de las instalaciones", "Community Schedule": "Horario comunitario", "A weekly picture of who is on which field, and when. Filter by sport, day, facility, activity type, organization or user category.": "Una vista semanal de quién usa cada campo y cuándo. Filtra por deporte, día, instalación, tipo de actividad, organización o categoría de usuario.",
    "Sport": "Deporte", "Day": "Día", "Activity Type": "Tipo de actividad", "Organization": "Organización", "User Category": "Categoría de usuario", "All days": "Todos los días", "All facilities": "Todas las instalaciones", "All types": "Todos los tipos", "All organizations": "Todas las organizaciones", "All categories": "Todas las categorías", "Clear filters": "Borrar filtros", "No activities match these filters.": "Ninguna actividad coincide con estos filtros.",
    "Last Updated:": "Última actualización:", "Report a Schedule Update": "Reportar un cambio de horario", "Report a change": "Reportar un cambio", "View group": "Ver grupo", "Category": "Categoría",
    "“Schedules displayed here are provided as a community information resource and may change. Official permits, posted park regulations and City of Los Angeles Department of Recreation and Parks requirements govern facility use.”": "“Los horarios mostrados aquí son un recurso informativo comunitario y pueden cambiar. Los permisos oficiales, el reglamento del parque y los requisitos del Departamento de Recreación y Parques de la Ciudad de Los Ángeles rigen el uso de las instalaciones.”",
    "Sunday": "Domingo", "Monday": "Lunes", "Tuesday": "Martes", "Wednesday": "Miércoles", "Thursday": "Jueves", "Friday": "Viernes", "Saturday": "Sábado", "Sun": "Dom", "Mon": "Lun", "Tue": "Mar", "Wed": "Mié", "Thu": "Jue", "Fri": "Vie", "Sat": "Sáb",
    "Softball Diamond A (upper left)": "Diamante de sóftbol A (superior izquierdo)", "Softball Diamond B (upper right)": "Diamante de sóftbol B (superior derecho)", "Softball Diamond C (lower left)": "Diamante de sóftbol C (inferior izquierdo)", "Softball Diamond D (lower right)": "Diamante de sóftbol D (inferior derecho)", "Los Angeles Cricket Ground (center)": "Campo de Críquet de Los Ángeles (centro)", "Shared Outfield": "Jardín compartido", "West Lawn & Picnic Area": "Césped oeste y área de pícnic", "Perimeter Road & Path": "Camino perimetral",
    "Softball Diamond A": "Diamante de sóftbol A", "Softball Diamond B": "Diamante de sóftbol B", "Softball Diamond C": "Diamante de sóftbol C", "Softball Diamond D": "Diamante de sóftbol D", "Diamond A": "Diamante A", "Diamond B": "Diamante B", "Diamond C": "Diamante C", "Diamond D": "Diamante D", "Cricket Ground": "Campo de críquet", "Parking": "Estacionamiento", "West Lawn": "Césped oeste", "Restrooms": "Baños", "Field entrance": "Entrada al campo", "Access road": "Camino de acceso", "Perimeter Road": "Camino perimetral", "Bleachers": "Gradas",
    "Who Uses Hjelte": "Quién usa Hjelte", "The Hjelte Community": "La comunidad de Hjelte", "Leagues, clubs, youth programs and neighborhood groups — organized and informal — share the complex. Find them, follow them, reach out.": "Ligas, clubes, programas juveniles y grupos vecinales, organizados e informales, comparten el complejo. Encuéntralos, síguelos y ponte en contacto.",
    "Search by name, sport or program…": "Buscar por nombre, deporte o programa…", "Age": "Edad", "Level": "Nivel", "Type": "Tipo", "When": "Cuándo", "Permit": "Permiso", "Youth": "Jóvenes", "Adult": "Adultos", "Mixed": "Mixto", "Competitive": "Competitivo", "Recreational": "Recreativo", "Permitted": "Con permiso", "Community": "Comunitario", "Any": "Cualquiera", "Weekday": "Entre semana", "Weekend": "Fin de semana",
    "Permitted Organizations & Programs": "Organizaciones y programas con permiso", "Organizations, teams, leagues or programs with scheduled or authorized facility use.": "Organizaciones, equipos, ligas o programas con uso programado o autorizado de las instalaciones.",
    "Community & Independent Groups": "Grupos comunitarios e independientes", "Informal teams, recurring community groups and recreational users who participate at Hjelte outside formal organizational programming.": "Equipos informales, grupos comunitarios recurrentes y usuarios recreativos que participan en Hjelte fuera de la programación organizada.",
    "No permitted organizations match.": "Ninguna organización con permiso coincide.", "No community groups match.": "Ningún grupo comunitario coincide.", "No groups match your search.": "Ningún grupo coincide con tu búsqueda.",
    "Contact": "Contactar", "Website": "Sitio web", "Social": "Redes",
    "PERMITTED ORGANIZATION": "ORGANIZACIÓN CON PERMISO", "COMMUNITY GROUP": "GRUPO COMUNITARIO", "YOUTH PROGRAM": "PROGRAMA JUVENIL", "LEAGUE": "LIGA", "OPEN RECREATION": "RECREACIÓN ABIERTA", "NONPROFIT": "SIN FINES DE LUCRO", "RECURRING COMMUNITY ACTIVITY": "ACTIVIDAD COMUNITARIA RECURRENTE",
    "No permit on file": "Sin permiso registrado", "Permit status unknown": "Estado del permiso desconocido", "Paid permit": "Permiso pagado",
    "Full Roster": "Lista completa", "Every group that participates at Hjelte, with permit status. Permit information is self-reported or confirmed by the hub maintainers; the City's permit records govern.": "Todos los grupos que participan en Hjelte, con su estado de permiso. La información es autodeclarada o confirmada por los administradores del centro; los registros de permisos de la Ciudad prevalecen.",
    "Group": "Grupo", "Program": "Programa", "Permit status": "Estado del permiso", "Days": "Días", "Paid": "Pagado", "Unpaid": "Sin pago", "Show roster": "Ver lista", "Hide roster": "Ocultar lista",
    "Add Your Group": "Agrega tu grupo", "Do You Play at Hjelte?": "¿Juegas en Hjelte?", "Help make the community directory more complete.": "Ayuda a completar el directorio comunitario.",
    "Whether you represent a league, club, team, neighborhood group, youth program or recurring recreational group, tell the Hjelte community who you are.": "Ya sea que representes una liga, club, equipo, grupo vecinal, programa juvenil o grupo recreativo recurrente, cuéntale a la comunidad de Hjelte quién eres.",
    "Appear in the directory and on the schedule": "Aparece en el directorio y el horario", "Make it easy for new players to find you": "Facilita que nuevos jugadores te encuentren", "Coordinate field use with neighbors": "Coordina el uso del campo con los vecinos",
    "Directory inclusion does not represent official City recognition or permit status unless specifically indicated.": "La inclusión en el directorio no representa reconocimiento oficial de la Ciudad ni estado de permiso, salvo que se indique.",
    "Group Name *": "Nombre del grupo *", "Sport *": "Deporte *", "Organization Type *": "Tipo de organización *", "Primary Contact *": "Contacto principal *", "Email *": "Correo electrónico *", "Phone": "Teléfono", "optional": "opcional", "Instagram / Social": "Instagram / Redes", "Typical Days": "Días habituales", "Typical Times": "Horarios habituales", "Approximate Number of Participants": "Número aproximado de participantes", "Youth / Adult / Mixed": "Jóvenes / Adultos / Mixto", "Short Description": "Descripción breve", "Upload Logo": "Subir logo", "Upload Group Photo": "Subir foto del grupo",
    "Does your organization currently hold a facility permit?": "¿Tu organización tiene actualmente un permiso de uso de las instalaciones?", "Yes": "Sí", "Not sure": "No estoy seguro", "Prefer not to say": "Prefiero no decir", "Submit Group": "Enviar grupo", "Select…": "Selecciona…",
    "Team": "Equipo", "Nonprofit": "Organización sin fines de lucro", "Neighborhood Group": "Grupo vecinal", "Recurring Recreational Group": "Grupo recreativo recurrente", "School": "Escuela", "Other": "Otro",
    "Please complete the required fields.": "Completa los campos obligatorios.", "Thank you. Your submission was received.": "Gracias. Recibimos tu solicitud.", "Sending…": "Enviando…", "Could not send online; opening your email app instead.": "No se pudo enviar en línea; abriendo tu aplicación de correo.", "Opening your email app with the details pre-filled. Send it to complete your submission.": "Abriendo tu correo con los datos prellenados. Envíalo para completar la solicitud.",
    "Submitting opens a pre-filled email to the hub maintainers; attach your logo and photo to that email. Inclusion does not represent official City recognition or permit status unless specifically indicated.": "Al enviar se abre un correo prellenado a los administradores; adjunta tu logo y foto a ese correo. La inclusión no representa reconocimiento oficial de la Ciudad ni estado de permiso, salvo que se indique.",
    "Your listing was sent for review. It appears once a hub admin approves it.": "Tu solicitud fue enviada para revisión. Aparecerá cuando un administrador la apruebe.",
    "Facility Map": "Mapa de las instalaciones", "Explore Hjelte Sports Center": "Explora Hjelte Sports Center",
    "Tap a field, entrance or amenity to learn how it's used and jump to its schedule. Four softball diamonds share one outfield with the cricket ground at its center; drawn to scale from measured spans.": "Toca un campo, entrada o servicio para saber cómo se usa y ver su horario. Cuatro diamantes de sóftbol comparten un jardín con el campo de críquet en el centro; dibujado a escala a partir de medidas.",
    "Select a location on the map to see details.": "Selecciona un lugar en el mapa para ver detalles.", "Sport / activity": "Deporte / actividad", "Field information": "Información del campo", "Typical uses": "Usos habituales", "Accessibility": "Accesibilidad", "Information not yet available.": "Información no disponible todavía.",
    "Open Turf": "Césped abierto", "Softball Diamond": "Diamante de sóftbol", "Entrance": "Entrada", "Seating": "Asientos", "Path": "Sendero", "Open Lawn": "Césped abierto",
    "Drawn to scale from measured home-plate spans (Los Angeles Cricket concept plan; Google Maps estimates, not a survey). Cyan circle = 420 ft cricket playing area.": "Dibujado a escala a partir de las distancias medidas entre home plates (plan conceptual de Los Angeles Cricket; estimaciones de Google Maps, no un levantamiento). Círculo cian = área de juego de críquet de 420 pies.",
    "Featured Facility Development": "Desarrollo destacado", "Growing Hjelte Together": "Haciendo crecer Hjelte juntos", "Improvements made possible by community organizations, partners, volunteers and stakeholders — for everyone who uses the complex.": "Mejoras posibles gracias a organizaciones comunitarias, socios, voluntarios y colaboradores, para todos los que usan el complejo.",
    "Before": "Antes", "During construction": "Durante la construcción", "Completed pitch": "Pitch terminado", "Open turf prior to pitch development.": "Césped abierto antes de crear el pitch.", "Grading, soil preparation and turf establishment.": "Nivelación, preparación del suelo y siembra del césped.", "Natural-turf pitch ready for play.": "Pitch de césped natural listo para jugar.",
    "Funding source": "Fuente de financiamiento", "Completion status": "Estado", "Community benefit": "Beneficio comunitario", "Partners": "Socios", "Developed by": "Desarrollado por", "COMPLETED": "TERMINADO", "Ground geometry": "Geometría del campo", "Plans & guides": "Planos y guías", "Ground plan & dimensions": "Plano y dimensiones", "Visitor guide": "Guía para visitantes",
    "20 ft × 80 ft natural-turf cricket pitch developed within Hjelte Sports Center.": "Pitch de críquet de césped natural de 20 × 80 pies creado dentro de Hjelte Sports Center.",
    "Projects & Improvements": "Proyectos y mejoras", "Ideas Becoming Improvements": "Ideas que se vuelven mejoras", "Proposed": "Propuesto", "Planning": "Planificación", "Fundraising": "Recaudación", "In Progress": "En curso", "Completed": "Terminado",
    "PROPOSED": "PROPUESTO", "PLANNING": "PLANIFICACIÓN", "FUNDRAISING": "RECAUDACIÓN", "IN PROGRESS": "EN CURSO",
    "Facility updates": "Mejoras de instalaciones", "Fields & turf": "Campos y césped", "Seating & shade": "Asientos y sombra", "Safety & lighting": "Seguridad e iluminación", "Equipment": "Equipamiento", "Signage & wayfinding": "Señalización", "Water & irrigation": "Agua y riego",
    "Upcoming project areas": "Áreas de próximos proyectos", "All areas": "Todas las áreas", "Lead:": "Responsable:", "Partners:": "Socios:", "Volunteer:": "Voluntariado:", "raised": "recaudado", "Support This Project": "Apoyar este proyecto", "See the story": "Ver la historia", "No projects with this status yet.": "Aún no hay proyectos con este estado.", "Target": "Objetivo", "projects": "proyectos", "project": "proyecto",
    "Stewardship": "Cuidado del parque", "Who Keeps Hjelte Going": "Quién mantiene Hjelte", "The effort behind the fields: maintenance, cleanups, repairs and materials contributed by the groups who play here. Logged by group admins and verified by the hub.": "El esfuerzo detrás de los campos: mantenimiento, limpiezas, reparaciones y materiales aportados por los grupos que juegan aquí. Registrado por los administradores de grupo y verificado por el centro.",
    "Volunteer hours": "Horas de voluntariado", "Volunteer shifts": "Turnos de voluntarios", "Work days": "Jornadas de trabajo", "Materials & services": "Materiales y servicios", "Recent work": "Trabajo reciente", "By organization": "Por organización", "Verified": "Verificado", "Pending": "Pendiente", "hrs": "h", "people": "personas", "Log your group's work": "Registra el trabajo de tu grupo",
    "Contribute": "Contribuye", "Help Improve Hjelte": "Ayuda a mejorar Hjelte", "There are many ways to contribute beyond playing.": "Hay muchas formas de contribuir más allá de jugar.",
    "Volunteer": "Voluntariado", "Support cleanup days, sports programs, events, field preparation and community projects.": "Apoya jornadas de limpieza, programas deportivos, eventos, preparación de campos y proyectos comunitarios.",
    "Sponsor": "Patrocina", "Businesses and organizations can support programs, facilities and events.": "Empresas y organizaciones pueden apoyar programas, instalaciones y eventos.", "Become a Sponsor": "Ser patrocinador",
    "Donate Equipment": "Dona equipamiento", "Contribute sports equipment, field equipment, tents, water stations, seating or other useful materials.": "Aporta equipo deportivo, equipo de campo, carpas, estaciones de agua, asientos u otros materiales útiles.", "Contribute Equipment": "Donar equipo",
    "Fund a Project": "Financia un proyecto", "Support a specific improvement.": "Apoya una mejora concreta.", "View Projects": "Ver proyectos",
    "Collaborate": "Colabora", "Schools, nonprofits, leagues, businesses and community organizations can propose partnerships.": "Escuelas, organizaciones sin fines de lucro, ligas, empresas y organizaciones comunitarias pueden proponer alianzas.", "Start a Conversation": "Iniciar una conversación",
    "Find Us. Reach Us.": "Encuéntranos. Escríbenos.", "Address": "Dirección", "Facility hours": "Horario de las instalaciones", "Permit office (City of LA Rec & Parks)": "Oficina de permisos (Recreación y Parques de LA)", "Community hub email": "Correo del centro comunitario", "Region": "Región", "Open in Maps": "Abrir en Maps", "City of LA Rec & Parks page →": "Página de Recreación y Parques de LA →",
    "This hub is maintained by the Hjelte community. It is not an official City of Los Angeles website. For permits, contact the Department of Recreation and Parks permit office.": "Este centro lo mantiene la comunidad de Hjelte. No es un sitio oficial de la Ciudad de Los Ángeles. Para permisos, contacta a la oficina de permisos del Departamento de Recreación y Parques.",
    "Send a message": "Envía un mensaje", "Name *": "Nombre *", "Topic": "Tema", "Message *": "Mensaje *", "Send Message": "Enviar mensaje",
    "General question": "Pregunta general", "Schedule update": "Cambio de horario", "Add or update a group listing": "Agregar o actualizar un grupo", "Volunteering": "Voluntariado", "Sponsorship": "Patrocinio", "Equipment donation": "Donación de equipo", "Fund a project": "Financiar un proyecto", "Partnership proposal": "Propuesta de alianza", "Facility issue": "Problema en las instalaciones",
    "Daily, dawn – 10:30 PM": "Todos los días, del amanecer a las 10:30 PM",
    "A community-maintained information hub for everyone who plays, coaches, volunteers and gathers at Hjelte Sports Center in Encino.": "Un centro de información mantenido por la comunidad para todos los que juegan, entrenan, colaboran y se reúnen en Hjelte Sports Center en Encino.",
    "Schedules, listings and project details are community-provided and may change. Official permits, posted park regulations and City of Los Angeles Department of Recreation and Parks requirements govern facility use.": "Horarios, listados y detalles de proyectos son aportados por la comunidad y pueden cambiar. Los permisos oficiales, el reglamento del parque y los requisitos del Departamento de Recreación y Parques de la Ciudad de Los Ángeles rigen el uso de las instalaciones.",
    "Add your group": "Agrega tu grupo", "Report an update": "Reportar un cambio", "Hjelte Sports Center Community Hub": "Centro Comunitario de Hjelte Sports Center",
    "Today": "Hoy",
    "Map": "Mapa",
    "See What's On Today": "Ver qué hay hoy",
    "Open the Facility Map": "Abrir el mapa",
    "Groups & Programs": "Grupos y programas",
    "More filters": "Más filtros",
    "Getting a Field Permit at Hjelte": "Cómo obtener un permiso de campo en Hjelte",
    "Get updates by sport, or everything": "Recibe novedades por deporte o de todo",
    "Which sports do you want updates about?": "¿Sobre qué deportes quieres novedades?",
    "Fee": "Cuota",
    "Hub maintainers": "Administradores del centro",
    "End time must be after the start time.": "La hora de fin debe ser posterior a la de inicio.",
    "Selected map location": "Ubicación seleccionada en el mapa",
    "Subscribe to updates": "Suscribirse a novedades",
    "Full roster of groups": "Lista completa de grupos",
    "Get updates by sport, or everything": "Recibe novedades por deporte o de todo",
    "Hub maintainers": "Administradores del centro",
    "Community volunteers": "Voluntarios de la comunidad",
    "Open lawn — general community use": "Césped abierto — uso general de la comunidad",
    "Infield grooming — Diamonds A–B": "Acondicionamiento del cuadro — Diamantes A–B",
    "Outfield mowing & irrigation check": "Corte del jardín y revisión de riego",
    "Los Angeles Cricket": "Los Angeles Cricket",
    "Sign out": "Cerrar sesión",
    "Admin Center": "Centro de administración",
    "← Public site": "← Sitio público",
    "No work logged yet.": "Aún no se ha registrado trabajo.",
    "Ground plan & dimensions": "Plano y dimensiones",
    "Enhanced aerial concept with measured spans. Google Maps estimates, not a survey.": "Concepto aéreo mejorado con distancias medidas. Estimaciones de Google Maps, no un levantamiento.",
    "Quick guide for park visitors when cricket is in progress.": "Guía rápida para visitantes del parque cuando hay críquet."
  };

  // Patterns for strings that contain numbers or variable parts
  const RULES = [
    [/^(\d+) groups?$/, (m) => `${m[1]} ${m[1] === "1" ? "grupo" : "grupos"}`],
    [/^Groups \((\d+)\) · (\d+) weekly schedule blocks$/, (m) => `Grupos (${m[1]}) · ${m[2]} bloques semanales`],
    [/^(\d+) (activity|activities)$/, (m) => `${m[1]} ${m[1] === "1" ? "actividad" : "actividades"}`],
    [/^(\d+) (project|projects)$/, (m) => `${m[1]} ${m[1] === "1" ? "proyecto" : "proyectos"}`],
    [/^View schedule \((\d+) weekly\)$/, (m) => `Ver horario (${m[1]} por semana)`],
    [/^Goal \$([\d,]+)$/, (m) => `Meta $${m[1]}`],
    [/^to (\d.+)$/, (m) => `a ${m[1]}`],
    [/^(\d+) hrs$/, (m) => `${m[1]} h`],
    [/^(\d+) people$/, (m) => `${m[1]} personas`]
  ];

  const originals = new Map();
  const ATTRS = ["placeholder", "title", "aria-label"];
  function translateString(s) {
    const t = s.trim(); if (!t) return null;
    if (ES[t]) return s.replace(t, ES[t]);
    for (const [re, fn] of RULES) { const m = t.match(re); if (m) return s.replace(t, fn(m)); }
    return null;
  }
  function handle(node) {
    if (node.nodeType === 3) {
      if (node.parentNode && /^(SCRIPT|STYLE)$/.test(node.parentNode.nodeName)) return;
      const out = translateString(node.nodeValue);
      if (out !== null) { if (!originals.has(node)) originals.set(node, node.nodeValue); node.nodeValue = out; }
    } else if (node.nodeType === 1) {
      ATTRS.forEach((a) => {
        if (!node.hasAttribute(a)) return;
        const out = translateString(node.getAttribute(a));
        if (out === null) return;
        const k = "i18n" + a.replace("-", "");
        if (!node.dataset[k]) node.dataset[k] = node.getAttribute(a);
        node.setAttribute(a, out);
      });
    }
  }
  function walk(root) {
    handle(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    let n; while ((n = tw.nextNode())) handle(n);
  }
  function restore() {
    originals.forEach((v, node) => { if (node.isConnected) node.nodeValue = v; });
    originals.clear();
    document.querySelectorAll("[data-i18nplaceholder],[data-i18ntitle],[data-i18narialabel]").forEach((el) => {
      if (el.dataset.i18nplaceholder) el.setAttribute("placeholder", el.dataset.i18nplaceholder);
      if (el.dataset.i18ntitle) el.setAttribute("title", el.dataset.i18ntitle);
      if (el.dataset.i18narialabel) el.setAttribute("aria-label", el.dataset.i18narialabel);
    });
  }
  let observer = null;
  function apply(root) { if (lang === "es") walk(root || document.body); }
  function startObserver() {
    if (observer || lang !== "es") return;
    observer = new MutationObserver((muts) => {
      observer.disconnect();
      muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 || n.nodeType === 3) walk(n); }));
      observer.observe(document.body, { childList: true, subtree: true });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function set(next) {
    next = next === "es" ? "es" : "en";
    try { localStorage.setItem(KEY, next); } catch (e) { /* storage unavailable */ }
    if (next === lang) return;
    lang = next; document.documentElement.lang = lang;
    if (lang === "es") { document.title = "Hjelte Sports Center — Centro Deportivo Comunitario · Encino, CA"; }
    else { document.title = "Hjelte Sports Center — Community Sports Hub · Encino, CA"; }
    if (observer) { observer.disconnect(); observer = null; }
    restore();
    if (window.HJELTE_RERENDER) window.HJELTE_RERENDER();
    if (lang === "es") { apply(); startObserver(); }
    document.querySelectorAll(".lang-toggle button").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  }
  document.documentElement.lang = lang;
  window.I18N = {
    get lang() { return lang; },
    set, apply,
    t: (s) => (lang === "es" ? (ES[s] || s) : s),
    get locale() { return lang === "es" ? "es-US" : "en-US"; },
    get days() { return lang === "es" ? ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; },
    get daysShort() { return lang === "es" ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; },
    init() {
      document.querySelectorAll(".lang-toggle button").forEach((b) => { b.classList.toggle("is-active", b.dataset.lang === lang); b.addEventListener("click", () => set(b.dataset.lang)); });
      if (lang === "es") { apply(); startObserver(); }
    }
  };
})();
