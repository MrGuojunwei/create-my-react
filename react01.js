/*
 * @Description: 
 * @Author: 郭军伟
 * @Date: 2020-05-13 18:26:49
 * @LastEditTime: 2020-05-14 15:11:42
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

function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode("")
    : document.createElement(fiber.type)



  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(attr => {
      dom[attr] = fiber.props[attr]
    })

  return dom;
}
const isEvent = key => key.startWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isGone = (prev, next) => key => !(key in next);
const isNew = (prev, next) => key => prev[key] !== next[key];


function updateDom(dom, prevProps, nextProps) {
  // remove old or change event listener 移除事件监听器
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => (!(key in nextProps) || isNew(prevProps, nextProps)(key))) // 如果旧节点有子节点没有  或者 旧节点和新节点事件监听器不一样，都要把旧的移除
    .forEach(eventName => {
      // 处理事件名 onClick
      let eventType = eventName.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[eventName]);
    })


  // remove old props
  Object.keys(prevProps)
    .filter(isProperty) // 过滤children属性
    .filter(isGone(prevProps, nextProps)) // 过滤新属性中不存在的属性
    .forEach(key => {
      dom[key] = ''
    })

  // add new props and update props
  Object.keys(nextProps)
    .filter(isProperty) // 过滤children属性
    .filter(isNew(prevProps, nextProps)) // 过滤不同的属性
    .forEach(key => {
      dom[key] = nextProps[key];
    })

  // add new Listener 添加事件监听器
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(eventName => {
      let eventType = eventName.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[eventName]);
    })
}

function commitRoot() {
  // TODO 添加nodes到dom
  deletions.forEach(commitWork)
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  }

  commitWork(fiber.child); // 处理子节点 
  commitWork(fiber.sibling); // 处理兄弟节点
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}



function render(element, container) {
  // TODO 设置下一个工作单元为fiberTree的根
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  nextUnitOfWork = wipRoot;
  deletions = [];
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null; // 保存上一次渲染的rootFiber
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 中断条件
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}


// 执行工作单元  返回下一个工作单元
function performUnitOfWork(fiber) {
  // TODO 将元素添加到dom
  let isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // TODO 返回下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = fiber.parent;
  }
}

function updateFunctionComponent(fiber) {
  const childrens = fiber.type(fiber.props);
  reconcileChildren(fiber, childrens);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // TODO 为元素的子代创建纤维
  const elements = fiber.props.children;
  reconcileChildren(wipFiber, elements);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];
    let newFiber = null;

    // TODO compare oldFiber to element
    const sameType = oldFiber && element && oldFiber.type === element.type;
    if (sameType) { // 更新属性即可
      // TODO update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    if (element && !sameType) { // 需要创建新的
      // TODO add new node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if (oldFiber && !sameType) {// 需要删除旧的
      // TODO delete the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    newFiber = {
      type: element.type,
      props: element.props,
      parent: wipFiber,
      dom: null
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber; // 所有子节点都有sibling属性，指向兄弟节点
    index++;
  }
}

// 请求闲置回调
function requestIdleCallback() {

}



Didact.render(element, document.getElementById('app'))