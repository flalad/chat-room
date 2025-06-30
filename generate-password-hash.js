const bcrypt = require('bcryptjs');

// 您的密码
const password = '1145141919810';

// 生成bcrypt哈希
const hash = bcrypt.hashSync(password, 10);

console.log('='.repeat(50));
console.log('密码哈希生成器');
console.log('='.repeat(50));
console.log('原始密码:', password);
console.log('bcrypt哈希:', hash);
console.log('='.repeat(50));
console.log('请将以下值设置为 ADMIN_PASSWORD_HASH 环境变量:');
console.log(hash);
console.log('='.repeat(50));

// 验证哈希是否正确
const isValid = bcrypt.compareSync(password, hash);
console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');