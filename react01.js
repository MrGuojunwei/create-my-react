/*
 * @Description: 
 * @Author: 郭军伟
 * @Date: 2020-05-13 18:26:49
 * @LastEditTime: 2020-05-13 19:24:14
 */
// const element = <h1 title='foo'>Hello</h1>;

function createElement(tag, attrs, ...children) {
  return {
    type: tag,
    props: {
      ...attrs,
      children: children.map(child => {
        return typeof child === 'object'
          ? child
          : createTextElement(child)
      })
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

const element = createElement(
  'h1',
  { title: 'foo' },
  createElement('div', { title: 'box' }, 'wrap', 'wrap-box'),
  createElement('p', { id: 'article' }, 'article')
)

const Didact = {
  createElement,
  render
}


function render(element, container) {
  const dom = element.type === 'TEXT_ELEMENT'
    ? document.createTextNode("")
    : document.createElement(element.type)

  const isProperty = key => key !== 'children';

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(attr => {
      dom[attr] = element.props[attr]
    })

  element.props.children.forEach(child => {
    render(child, dom);
  })

  container.appendChild(dom);
}

render(element, document.getElementById('app'))