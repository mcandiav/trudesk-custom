/**
 * i18n scoped to /newissue only (FAQ-Inn style).
 * Do not reuse as global Trudesk i18n.
 */
;(function (global) {
  'use strict'

  var STORAGE_KEY = 'atonce-newissue-lang'
  var SUPPORTED = ['es', 'pt', 'en']
  var DEFAULT_LANG = 'es'

  var LABELS = { es: 'Español', pt: 'Português', en: 'English' }
  var CODES = { es: 'ES', pt: 'PT', en: 'EN' }
  var FLAG_FILES = { es: 'es.svg', pt: 'br.svg', en: 'us.svg' }
  var FLAG_BASE = String(
    global.ATONCE_FLAG_BASE || '/img/flags/'
  ).replace(/\/?$/, '/')

  var MESSAGES = {
    es: {
      'page.title': 'Nuevo ticket',
      'lang.label': 'Idioma',
      'welcome.title': 'Nuevo ticket',
      'welcome.lead':
        'Este asistente te guiará para enviar un nuevo ticket de soporte.',
      'welcome.start': 'Comenzar',
      'user.title': 'Tus datos',
      'user.lead':
        'Necesitamos saber cómo registrar tu solicitud. Indícanos un poco sobre ti.',
      'user.fullname': 'Nombre completo',
      'user.email': 'Correo electrónico',
      'user.captcha': 'Escribe las letras que ves arriba.',
      'user.back': 'Atrás',
      'user.next': 'Siguiente',
      'user.validating': 'Validando...',
      'user.privacy': 'Política de privacidad',
      'issue.title': 'Ticket',
      'issue.lead':
        'Cuéntanos el problema. Sé lo más detallado posible para resolverlo pronto.',
      'issue.subject': 'Asunto',
      'issue.body': 'Descripción',
      'issue.back': 'Atrás',
      'issue.submit': 'Enviar ticket',
      'creating.title': 'Creando ticket...',
      'creating.lead':
        'Gracias por enviar tu solicitud. Te enviamos un correo con los datos de acceso para ver y crear tickets en el futuro.',
      'emailExists.title': 'El correo ya existe',
      'emailExists.lead':
        'El correo {email} ya está registrado. Si ya tienes cuenta, inicia sesión y crea el ticket desde allí.',
      'emailExists.login': 'Iniciar sesión',
      'emailExists.restart': 'Empezar de nuevo',
      'created.thanks': 'Gracias',
      'created.lead':
        'Tu ticket, {subject}, fue enviado. Guarda la siguiente información para acceder y actualizarlo.',
      'created.username': 'Usuario',
      'created.password': 'Contraseña',
      'created.follow':
        'Usa el enlace de abajo para iniciar sesión y ver el estado de este ticket.',
      'created.login': 'Iniciar sesión',
      'privacy.back': 'Atrás',
      'error.captcha': 'Ocurrió un error. Revisa el captcha.',
      'error.generic': 'Ocurrió un error.',
      'restart.title': 'Reinicio necesario',
      'restart.lead':
        'La aplicación debe reiniciarse. Reiníciala y deberías ver la pantalla de inicio de sesión.',
      'restart.btn': 'Reiniciar',
      'fatal.title': 'Algo salió mal',
      'fatal.lead':
        'Hubo un problema inesperado. Puedes reintentar o volver a empezar.',
      'fatal.submit': 'Reportar el problema',
      'fatal.retry': 'Empezar de nuevo',
      'fatal.docs': 'Ver documentación'
    },
    pt: {
      'page.title': 'Novo chamado',
      'lang.label': 'Idioma',
      'welcome.title': 'Novo chamado',
      'welcome.lead':
        'Este assistente vai te guiar no envio de um novo chamado de suporte.',
      'welcome.start': 'Começar',
      'user.title': 'Seus dados',
      'user.lead':
        'Precisamos saber como registrar sua solicitação. Conte um pouco sobre você.',
      'user.fullname': 'Nome completo',
      'user.email': 'E-mail',
      'user.captcha': 'Digite as letras que você vê acima.',
      'user.back': 'Voltar',
      'user.next': 'Próximo',
      'user.validating': 'Validando...',
      'user.privacy': 'Política de privacidade',
      'issue.title': 'Chamado',
      'issue.lead':
        'Conte o problema. Seja o mais detalhado possível para resolvermos rápido.',
      'issue.subject': 'Assunto',
      'issue.body': 'Descrição',
      'issue.back': 'Voltar',
      'issue.submit': 'Enviar chamado',
      'creating.title': 'Criando chamado...',
      'creating.lead':
        'Obrigado pelo envio. Enviamos um e-mail com os dados de acesso para ver e criar chamados no futuro.',
      'emailExists.title': 'E-mail já existe',
      'emailExists.lead':
        'O e-mail {email} já está cadastrado. Se você já tem conta, faça login e abra o chamado por lá.',
      'emailExists.login': 'Entrar',
      'emailExists.restart': 'Começar de novo',
      'created.thanks': 'Obrigado',
      'created.lead':
        'Seu chamado, {subject}, foi enviado. Guarde as informações abaixo para acessar e atualizar.',
      'created.username': 'Usuário',
      'created.password': 'Senha',
      'created.follow':
        'Use o link abaixo para entrar e ver o status deste chamado.',
      'created.login': 'Entrar',
      'privacy.back': 'Voltar',
      'error.captcha': 'Ocorreu um erro. Verifique o captcha.',
      'error.generic': 'Ocorreu um erro.',
      'restart.title': 'Reinício necessário',
      'restart.lead':
        'O aplicativo precisa reiniciar. Reinicie e você deverá ver a tela de login.',
      'restart.btn': 'Reiniciar',
      'fatal.title': 'Algo deu errado',
      'fatal.lead':
        'Houve um problema inesperado. Você pode tentar de novo ou recomeçar.',
      'fatal.submit': 'Reportar o problema',
      'fatal.retry': 'Começar de novo',
      'fatal.docs': 'Ver documentação'
    },
    en: {
      'page.title': 'New Issue',
      'lang.label': 'Language',
      'welcome.title': 'New Issue',
      'welcome.lead':
        'This wizard will walk you through the process of submitting a new issue.',
      'welcome.start': "Let's Get Started",
      'user.title': 'User Information',
      'user.lead':
        'We need to know how to store your request. Please give us a little information about you.',
      'user.fullname': 'Full Name',
      'user.email': 'Email',
      'user.captcha': 'Please enter the letters you see above.',
      'user.back': 'Back',
      'user.next': 'Next',
      'user.validating': 'Validating...',
      'user.privacy': 'Privacy Policy',
      'issue.title': 'Issue',
      'issue.lead':
        "Please tell us about the issue you're having. Remember to be as detailed as possible to ensure its resolved promptly.",
      'issue.subject': 'Subject',
      'issue.body': 'Issue',
      'issue.back': 'Back',
      'issue.submit': 'Submit Issue',
      'creating.title': 'Creating Issue...',
      'creating.lead':
        'Thank you for submitting your issue. An email has been sent to you with login details to view and create future tickets.',
      'emailExists.title': 'Email Already Exists',
      'emailExists.lead':
        'The email {email} already exists. If you already have an account using this email please login and submit your ticket.',
      'emailExists.login': 'Login',
      'emailExists.restart': 'Start Over',
      'created.thanks': 'Thank you',
      'created.lead':
        'Your issue, {subject}, has been submitted. Please store the following information to access and update your ticket.',
      'created.username': 'Username',
      'created.password': 'Password',
      'created.follow':
        'Please follow the link below in order to login and update or view the current status of this issue.',
      'created.login': 'Login',
      'privacy.back': 'Back',
      'error.captcha': 'An Error occurred. Check Captcha.',
      'error.generic': 'An Error occurred.',
      'restart.title': 'Time to Restart',
      'restart.lead':
        'The application needs to restart. Restart it and you should get a login screen.',
      'restart.btn': 'Restart',
      'fatal.title': 'Something went wrong',
      'fatal.lead':
        'An unexpected problem occurred. You can retry or start over.',
      'fatal.submit': 'I think I should submit this issue.',
      'fatal.retry': 'I think I will start over.',
      'fatal.docs': 'or maybe I should read the docs!'
    }
  }

  var currentLang = DEFAULT_LANG

  function normalize (lang) {
    lang = String(lang || '').toLowerCase().slice(0, 2)
    return SUPPORTED.indexOf(lang) >= 0 ? lang : DEFAULT_LANG
  }

  function t (key, vars) {
    var pack = MESSAGES[currentLang] || MESSAGES[DEFAULT_LANG]
    var text = (pack && pack[key]) || (MESSAGES.en && MESSAGES.en[key]) || key
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k])
      })
    }
    return text
  }

  function applyI18n (root) {
    root = root || document
    var nodes = root.querySelectorAll('[data-i18n]')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var key = el.getAttribute('data-i18n')
      if (!key) continue
      if (el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = t(key)
      } else {
        el.textContent = t(key)
      }
    }

    var site = document.querySelector('title')
    if (site) {
      var parts = site.textContent.split('·')
      var brand = parts.length > 1 ? parts[parts.length - 1].trim() : 'HelpDesk At-Once-AI'
      site.textContent = t('page.title') + ' · ' + brand
    }

    document.documentElement.setAttribute('lang', currentLang)
    updatePicker()
  }

  function updatePicker () {
    var buttons = document.querySelectorAll('.lang-flag[data-newissue-lang], .lang-flag[data-lang]')
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i]
      var code = btn.getAttribute('data-newissue-lang') || btn.getAttribute('data-lang')
      var active = code === currentLang
      btn.classList.toggle('active', active)
      btn.classList.toggle('is-active', active)
      btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    }
    var groups = document.querySelectorAll('[data-newissue-lang-picker], [data-lang-picker]')
    for (var g = 0; g < groups.length; g++) {
      groups[g].setAttribute('aria-label', t('lang.label'))
    }
  }

  function setLang (lang) {
    currentLang = normalize(lang)
    try {
      global.localStorage.setItem(STORAGE_KEY, currentLang)
    } catch (e) {}
    applyI18n()
    if (typeof global.onNewIssueLangChange === 'function') {
      global.onNewIssueLangChange(currentLang)
    }
  }

  function initLang () {
    var stored = null
    try {
      stored = global.localStorage.getItem(STORAGE_KEY)
    } catch (e) {}
    var nav = (global.navigator && (global.navigator.language || global.navigator.userLanguage)) || DEFAULT_LANG
    currentLang = normalize(stored || nav)
  }

  function mountPicker () {
    var containers = document.querySelectorAll('[data-newissue-lang-picker], [data-lang-picker]')
    for (var c = 0; c < containers.length; c++) {
      var container = containers[c]
      container.setAttribute('role', 'group')
      if (!container.classList.contains('lang-picker')) {
        container.classList.add('lang-picker')
      }
      var html = ''
      for (var i = 0; i < SUPPORTED.length; i++) {
        var lang = SUPPORTED[i]
        html +=
          '<button type="button" class="lang-flag" data-newissue-lang="' +
          lang +
          '" data-lang="' +
          lang +
          '" title="' +
          LABELS[lang] +
          '" aria-label="' +
          LABELS[lang] +
          '">' +
          '<img class="lang-flag__img" src="' +
          FLAG_BASE +
          FLAG_FILES[lang] +
          '" alt="" width="18" height="12" />' +
          '<span class="lang-flag__code">' +
          CODES[lang] +
          '</span>' +
          '</button>'
      }
      container.innerHTML = html
      container.querySelectorAll('[data-newissue-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setLang(btn.getAttribute('data-newissue-lang'))
        })
      })
    }
    updatePicker()
  }

  initLang()

  global.NewIssueI18n = {
    t: t,
    setLang: setLang,
    getLang: function () {
      return currentLang
    },
    apply: applyI18n,
    mount: function () {
      mountPicker()
      applyI18n()
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      global.NewIssueI18n.mount()
    })
  } else {
    global.NewIssueI18n.mount()
  }
})(typeof window !== 'undefined' ? window : this)
