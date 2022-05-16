class isolde {
  constructor({
    parent        = document.querySelector('#isolde'),
    links         = document.querySelectorAll('[data-isolde-link]'),
    active        = 'is-active',
    margin        = 20,
    responsive    = {
      1023: {
        columns: 4
      },
      767: {
        columns: 3
      },
      575: {
        columns: 2
      },
      0: {
        columns: 1
      }
    },
    fadeDuration  = {
      in: 300,
      out: 0
    }
  } = {}) {
    this.parent           = parent
    this.links            = Array.from(links)
    this.active           = active
    this.margin           = margin
    this.responsive       = responsive
    this.fadeDuration     = fadeDuration
    this.elements         = Array.from(this.parent.children)
    this.activeElements   = this.elements
    this.columns          = 1
    this.dataLink         = 'all'
    this.winWidth         = window.innerWidth

    this.init()
  }

  orderElements() {
    let {parent, activeElements, columns, blocWidth, responsive, margin} = this

    let arrayRectHeight   = activeElements.reduce((acc, el, id) => {
      let columnsHeight   = this.sumArrHeight(acc, columns)
      let positionX       = (id%columns) * (blocWidth + margin)
      let rectHeight      = (id - columns >= 0) ? (columnsHeight[id%columns] + (margin * Math.floor(id / columns))) : 0

      el.style.transform  = `translate3d(${positionX}px, ${rectHeight}px, 0)`

      acc.push(el.offsetHeight)
      return acc
    }, [])

    let columnsMaxHeight    = this.sumArrHeight(arrayRectHeight, columns)
    let parentHeight        = Math.max(...columnsMaxHeight) + (margin * (Math.floor(activeElements.length / columns) - 1))
    parent.style.height     = `${parentHeight}px`
  }

  handleFilterClick(ev, element) {
    ev.preventDefault()
    let {links, active} = this

    if(element.dataset.isoldeLink === this.dataLink) {
      return
    } else {
      this.dataLink = element.dataset.isoldeLink
      links.forEach(el => {
        el.isEqualNode(element) ? el.classList.add(active) : el.classList.remove(active)
      })
      this.filterElements(()=>{
        this.orderElements()
      })
    }
  }

  resize() {
    window.addEventListener('resize', () => {
      clearTimeout(window.sortableResize)
      window.sortableResize = setTimeout(() => {
        this.winWidth = window.innerWidth
        this._setBlocWidth(()=>{
          this.orderElements()
        })
      }, 300)
    })
  }

  init() {
    let {parent, links, active} = this

    links.forEach((el, id) => {
      if(id === 0) {
        el.classList.add(active)
        this.dataLink = el.dataset.isoldeLink
      }
      el.addEventListener('click', ev => {
        this.handleFilterClick(ev, el)
      })
    })

    this._setBlocWidth()

    window.addEventListener('load', () => {
      this.filterElements(()=>{
        this.orderElements()
      })
      parent.style.opacity = 1
    })

    this.resize()
  }

  _setBlocWidth(callback) {
    let {parent, elements, margin, responsive} = this

    let columns         = this.columns = this.columnsCount(responsive)['columns']
    let blocWidth       = this.blocWidth = (parent.clientWidth - (margin * (columns - 1))) / columns

    elements.forEach(el=>{
      el.style.width = `${blocWidth}px`
    })
    if(callback) {
      callback()
    }
  }

  filterElements(callback) {
    let {elements, dataLink, fadeDuration} = this

    this.activeElements = elements.filter(el => {
      if(dataLink === 'all') {
        this.fadeIn(el, fadeDuration.in)
        return true
      } else {
        if(el.dataset.isoldeEl !== dataLink) {
          this.fadeOut(el, fadeDuration.out)
          return false
        } else {
          this.fadeIn(el, fadeDuration.in)
          return true
        }
      }
    })

    if(callback) {
      callback()
    }
  }

  sumArrHeight(arr, col) {
    return arr.reduce((acc, val, id)=>{
      let cle = id%col
      if(!acc[cle]) {
        acc[cle] = 0
      }
      acc[cle] = acc[cle]+val
      return acc
    }, [])
  }

  columnsCount(obj) {
    let {winWidth} = this
    return Object.entries(obj).reduce((acc, val)=>{
      return winWidth > val[0] && val[0] >= Math.max(acc['width'])
        ? { width: val[0], columns: val[1]['columns'] }
        : acc
    }, {width: 0, columns: 4})
  }

  fadeIn(el, duration = 300, callback) {
    let opacity   = parseFloat(window.getComputedStyle(el, null).getPropertyValue("opacity")),
        interval  = 16,
        gap       = interval / duration

    el.style.display = 'block'

    function animation() {
      opacity += gap

      if(opacity <= 1) {
        el.style.opacity = opacity
        requestAnimationFrame(animation)
      } else {
        el.style.opacity = 1
        if(callback) {
          callback()
        }
      }
    }
    requestAnimationFrame(animation)
  }

  fadeOut(el, duration = 300, callback) {
    let opacity   = parseFloat(window.getComputedStyle(el, null).getPropertyValue("opacity")),
        interval  = 16,
        gap       = duration ? (interval / duration) : 1

    function animation() {
      opacity -= gap

      if(opacity >= 0) {
        el.style.opacity = opacity
        requestAnimationFrame(animation)
      } else {
        el.style.opacity = 0
        el.style.display = 'none'
        if(callback) {
          callback()
        }
      }
    }
    requestAnimationFrame(animation)
  }
}
