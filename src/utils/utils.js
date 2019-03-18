// 将对象转化为formdata格式
// 也就是application/x-www-form-urlencoded;charset=utf-8提交格式
// 如何使用formData提交参考：https://www.cnblogs.com/CyLee/p/9441535.html
export const obj2formdatastr = (body) => {
    if (body) {
        let formparams = '';
        Object.keys(body).forEach(key => {
            if (formparams.length > 0) {
                formparams += '&';
            }
            formparams = formparams + key + '=' + body[key];
        });
        return formparams
    }
    return ''
}