

module.exports = {
    register(req, res){
        //회원가입 -> 디렉토리 or DB생성 필요
        console.log('register');
    },

    login(req, res){
        //로그인
        console.log('login');
    },

    logout(req, res){
        //로그아웃
        console.log('logout');
    },

    unregister(req, res){
        console.log('unregister');
    }
};