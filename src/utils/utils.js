// 将对象转化为formdata格式
// 也就是application/x-www-form-urlencoded;charset=utf-8提交格式
// 如何使用formData提交参考：https://www.cnblogs.com/CyLee/p/9441535.html
export const obj2formdatastr = (body) => {
  if (body) {
    let formparams = ''
    Object.keys(body).forEach(key => {
      if (formparams.length > 0) {
        formparams += '&'
      }
      formparams = formparams + key + '=' + body[key]
    })
    return formparams
  }
  return ''
}

/**
 * 最简单且最安全的方法显示一个值，举个例子: 
 * var obj = {a: 123 }
   maybe(_=> obj.a, 0); // 123
   maybe(_=> obj.b, 0); // 0
   maybe(_=> obj.a.b.s.w.holy.shit.fuck.god, 0); // 0
 */
export const maybe = (fn, n = '') => {
  try {
      const result = fn()
      return (result && result === result && result !== 'NaN' && result !== 'undefined' && result !== 'Invalid date') ? result : n
  } catch (err) {
      return n
  }
}