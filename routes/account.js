var express = require('express');
var router = express.Router();
//引入数据库链接模块 （以后所有的增删改查操作都是用着一个模块）
const connection = require('./js/conn');
/* 写一个路由 统一设置响应头 */
router.all("*", (req, res, next) => {
    //设置响应头解决跨域
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "authorization"); // 允许通过头部信息authorization 携带token

    //方行
    next();
})



/* --------------------  验证token合法性开始  ---------------- */
// 准备一个签名（秘钥）
const secretKey = 'itsource';
/* 验证token的合法性 */
const expressJwt = require('express-jwt');

// 验证token的合法性
router.use(expressJwt({
    secret: secretKey
}).unless({
    path: ['/login/checklogin'] // 除了这个地址，其他的URL都需要验证（其他的所有请求 都要带上token 才能获取数据 否则不能获取到数据）
}));
// 路由拦截器
router.use(function(err, req, res, next) {
        // 如果前端没有token或者是错误的token 就会抛出如下错误
        if (err.name === 'UnauthorizedError') {
            // 响应给前端token无效的信息
            res.status(401).send('token不合法...');
        }
    })
    /* --------------------  验证token合法性结束  ---------------- */






/*写一个路由 统一设置响应头  */
router.post('/accountmanage', (req, res) => {
    // 接收数据
    let { user, password, userGroup } = req.body;

    // 写sql
    const sqlStr = `insert into account(user, password,  user_group) values('${user}', '${password}', '${userGroup}')`;

    // console.log(sqlStr) // 这里是一个测试点 一定要测试 否则出错 ！！！！
    // 执行sql
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        // 如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            // 响应成功的数据对象给前端
            res.send({ code: 0, reason: "添加账号成功!哈哈！" })
        } else {
            // 响应失败的数据对象给前端
            res.send({ code: 1, reason: "添加账号失败!呵呵！" })
        }
    })
})

/* 用户权限 */
// router.get('/menus', (req, res) => {
//     //获取用户
//     let userGroup = req.user.user_group;
//     let role = userGroup === '超级会员' ? 'super' : 'normal';
//     let menus = [
//         //系统管理
//         {
//             iconClass: 'el-icon-document',
//             title: '系统管理',
//             roles: ['super', 'normal'],
//             children: [ // 子菜单
//                 { path: '/home/systeminfo', subTitle: '系统信息' }
//             ]
//         },
//         // 账号管理
//         {
//             iconClass: 'el-icon-news',
//             title: '账号管理',
//             roles: ['super', 'normal'],
//             children: [
//                 { path: '/home/accountmanage', subTitle: '账号管理' },
//                 { path: '/home/accountadd', subTitle: '添加账号' },
//                 { path: '/home/passwordmodify', subTitle: '密码修改' }
//             ]
//         },
//         // 商品管理
//         {
//             iconClass: 'el-icon-goods',
//             title: '商品管理',
//             roles: ['super', 'normal'],
//             children: [
//                 { path: '/home/goodsmanage', subTitle: '商品管理' },
//                 { path: '/home/goodsadd', subTitle: '添加商品' },
//             ]
//         },
//         // 统计管理
//         {
//             iconClass: 'el-icon-edit-outline',
//             title: '统计管理',
//             roles: ['super'],
//             children: [
//                 { path: '/home/salestotal', subTitle: '销售统计' },
//                 { path: '/home/stocktotal', subTitle: '进货统计' },
//             ]
//         }
//     ]
//     let accessMenu = menus.filter(item => item.roles.includes(role))

//     res.send({ accessMenu })
// })


/* 头像上传 */
/* 个人信息 */
router.get('/accountinfo', (req, res) => {
    // 获取当前登录用户的id
    const id = req.user.id;
    const sqlStr = `select * from account where id=${id}`;
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        res.send(data)
    })
})

//引入multer
const multer = require('multer')
    //配置上传到服务器放置的目录和重命名
const storage = multer.diskStorage({
    destination: 'public/upload', //图片上传到服务器的这个目标
    //图片重命名
    filename(req, file, cb) {
        var fileFormat = (file.originalname).split("."); // haha.jpg => ['haha', 'jpg']
        // 获取时间戳
        var filename = new Date().getTime();
        // 124354654 + "." + jpg
        cb(null, filename + "." + fileFormat[fileFormat.length - 1]);
    }
})

// 上传对象
const upload = multer({
    storage,
});
/* 上传后端配置 */
/* 头像上传请求 */
router.post('/uploadavatar', upload.single('file'), (req, res) => {
    console.log(req.file);
    // 获取文件名
    let filename = req.file.filename;
    // 拼接路径
    let path = `/upload/${filename}`;



    // 构造sql
    const sqlStr = `update account set img_url='${path}' where id=${req.user.id}`;

    console.log(sqlStr);

    // 执行sql
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: "头像修改成功!", path })
        } else {
            res.send({ code: 1, reason: "头像修改失败" })
        }
    })
})





/* 请求账号列表路由 */
router.get('/accountlist', (req, res) => {
    // 写sql
    const sqlStr = `select * from account order by creat_date desc`;
    // 执行sql
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        res.send(data);
    })
})



/* 删除账号列表 */
router.get('/delaccount', (req, res) => {
    //接收id
    let { id } = req.query;
    //通过id进项删除，获取id
    const sqlStr = `delete from account where id=${id}`;
    /* console.log(sqlStr); */
    //执行
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: "删除成功" })
        } else {
            res.send({ code: 1, reason: '删除失败' })
        }
    })

})



/* 编辑修改 */
router.get('/alteraccount', (req, res) => {
    //接收id
    let { id } = req.query;
    //构造  查找所有的id
    const sqlStr = `select * from account where id=${id}`
        //console.log(sqlStr);
        //执行，把查找的id给前端
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        res.send(data) //把查询到的数据给前端
    })
})

/*  修改保存数据*/
router.post('/saveedtitaccount', (req, res) => {
    let { user, userGroup, editId } = req.body;

    // 构造sql
    const sqlStr = `update account set user='${user}', user_group='${userGroup}' where id=${editId}`;
    // 执行sql
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: "修改账号成功" })
        } else {
            res.send({ code: 1, reason: '修改账号失败' })
        }
    })
})

/* 批量删除 */
router.get('/alldel', (req, res) => {
    // res.send('2325')  见路由是否通
    //接收前端发过来的数据
    let { idArr } = req.query;
    //通过id进项删除，获取id
    const sqlStr = `delete from account where id in (${idArr})`;
    // console.log(sqlStr);检查，是否拿到
    //执行sqlstr
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: '批量删除成功' })
        } else {
            res.send({ code: 1, reason: '批量删除失败' })
        }

    })
})



//分页功能
router.get('/accountlistbypage', (req, res) => {
    //接收参数
    let { currentPage, pageSize } = req.query;
    let sqlStr = `select * from account order by  creat_date desc`;
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //结算总条数
        let total = data.length;
        //计算跳过多少条
        let n = (currentPage - 1) * pageSize;

        // 拼接分页sql
        sqlStr += `  limit ${n},  ${pageSize}`;
        //执行
        connection.query(sqlStr, (err, data) => {
            if (err) throw err;
            res.send({ total, data })
        })
    })

})




/* 原密码 验证*/

router.get('/changepassword', (req, res) => {
    //接收数据
    let { oldpassword } = req.query;
    //获取当前用户名密码，通过token的req.user,所有字段都存在里面
    let { password } = req.user;
    //判断是否相同
    if (password === oldpassword) {
        //相同成功
        res.send({ code: 0, reason: '原密码输入正确' })
    } else {
        res.send({ code: 1, reason: '原密码输入错误' })
    }
})

/* 确认修改密码 */
router.post('/surepassword', (req, res) => {
    //res.send('324243')
    //接收新密码
    let { password } = req.body;
    //获取当前登陆用户的id
    let { id } = req.user;
    //构造sql
    const sqlStr = `update account set password='${password}' where id='${id}'`;
    //console.log("我是新密码", sqlStr);
    //执行
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: '密码修改成功,请重新登陆' })
        } else {
            res.send({ code: 1, reason: "密码修改失败" })
        }
    })

})

/* 商品管理页面 */
router.post("/goodsadd", (req, res) => {
    //res.send("33333")
    //接收参数
    let { cateName, barCode, productName, GoodsPrice, MarketPrice, GoodPurchasePrice, LibrayNumber, GoodsWeight, GoodsCompany, discount, promotion, productbrief } = req.body;
    // 写sql
    const sqlStr = `insert into goods( cateName, barCode ,productName ,GoodsPrice ,MarketPrice, GoodPurchasePrice, LibrayNumber, GoodsWeight ,GoodsCompany ,discount ,promotion ,productbrief) values(?,?,?,?,?,?,?,?,?,?,?,?)`;
    const sqlParams = [cateName, barCode, productName, GoodsPrice, MarketPrice, GoodPurchasePrice, LibrayNumber, GoodsWeight, GoodsCompany, discount, promotion, productbrief];
    // console.log('我是参数', sqlStr);

    connection.query(sqlStr, sqlParams, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: "添加成功" })
        } else {
            res.send({ code: 1, reason: "添加失败" })
        }
    })

})

/* 商品添加页面 */
/* 所有数据 */
router.get('/goodslist', (req, res) => {
        //res.send("333333")
        //查询数据
        const sqlStr = `select * from goods order by ctime desc`;
        //执行sqltsr
        connection.query(sqlStr, (err, data) => {
            if (err) throw err;
            console.log(data);

            res.send(data)

        })

    })
    /* 商品删除 */
    /* 删除账号列表 */
router.get('/delgoods', (req, res) => {
    //接收id
    let { id } = req.query;
    //通过id进项删除，获取id
    const sqlStr = `delete from goods where id=${id}`;
    /* console.log(sqlStr); */
    //执行
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: "删除成功" })
        } else {
            res.send({ code: 1, reason: '删除失败' })
        }
    })

})

/* 分页   */
router.get('/goodslistbypage', (req, res) => {
    //接收参数
    let { currentPage, pageSize } = req.query;
    let sqlStr = `select * from goods order by  ctime desc`;
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //结算总条数
        let total = data.length;
        //计算跳过多少条
        let n = (currentPage - 1) * pageSize;

        // 拼接分页sql
        sqlStr += `  limit ${n},  ${pageSize}`;
        //执行
        connection.query(sqlStr, (err, data) => {
            if (err) throw err;
            res.send({ total, data })
        })
    })

})



/* 商品查询 */
router.get('/search', (req, res) => {
    //接收查询条件
    let { cateName, keyword } = req.query;
    //构造
    let sqlStr = `select *from goods where 1=1`;
    //如果为空或者全部 代表查询所有
    if (cateName !== '全部' && cateName !== '') {
        sqlStr += ` and cateName='${cateName}'`;
    }
    // 如果kewword为空就是查询所有名称或条形码 否则 就是查询条形码或名称包含关键字的
    if (keyword !== '') {
        sqlStr += ` and(goodsName like '%${keyword}%' or barCode like '%${keyword}%')`
    }
    // 执行sql
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        res.send(data);
    })
})

/* 批量删除 */
router.get('/alldelgoods', (req, res) => {
    // res.send('2325')  见路由是否通
    //接收前端发过来的数据
    let { idArr } = req.query;
    //通过id进项删除，获取id
    const sqlStr = `delete from goods where id in (${idArr})`;
    // console.log(sqlStr);检查，是否拿到
    //执行sqlstr
    connection.query(sqlStr, (err, data) => {
        if (err) throw err;
        //如果受影响行数大于0 代表成功 否则代表失败
        if (data.affectedRows > 0) {
            res.send({ code: 0, reason: '批量删除成功' })
        } else {
            res.send({ code: 1, reason: '批量删除失败' })
        }

    })
})

module.exports = router;