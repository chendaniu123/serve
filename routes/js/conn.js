//引入
const mysql = require('mysql')

//创建链接对象
const connection = mysql.createConnection({
        host: "localhost", //数据库地址
        user: "root", //用户名
        password: "root", //密码
        database: "supermarket", //要连接的数据库库名



    })
    //执行链接
connection.connect();
console.log("链接数据库成功")
    //暴露数据库连接模块
module.exports = connection;