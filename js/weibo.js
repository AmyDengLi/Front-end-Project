//功能一：监听文本框的内容创建评论框message标签
//功能二：监听顶踩删标签功能
//功能三：利用ajax来从后台提取保存数据，保证刷新后新添加的内容不会消失
//功能四：根据内容自动更新页码，并且给不同的页码分配message内容（cookie把数据存储在浏览器）
//功能五：hash保存当前页面，使得关闭浏览器后，再次打开仍显示当前页面


//首先时时监听textarea里面是否内容，一旦有内容，按钮才可用1(失去焦点时才用change不可用，采用事件委托时时监听)
function btnStyle(){
	if($('.comment').val().length>0){
		$('.btn').css('opacity','1');	//有内容时透明度为1
		$('.btn').prop('disabled',false);  //按钮可用
	}else{
		$('.btn').css('opacity','0.5');  //没有内容时透明度为0.5
		$('.btn').prop('disabled',true);  //按钮不可用
	}
};
	//时时监听textarea里面是否内容
$('body').delegate('.comment','propertychange input',function(){
	btnStyle();
})

//功能三：利用ajax来从后台提取保存数据，保证刷新后新添加的内容不会消失（一进来就要获取，所以把功能三添加到最前面）
function getMessageList(curPage){
    $('.messageLists').html('');
    /*weibo.php?act=get&page=1*/
	$.ajax({
		type:'get',
		url:'weibo.php',
		data:'act=get&page='+curPage,
		success:function(msg){
			/*返回：[{id: ID, content: "内容", time: 时间戳, acc: 顶次数, ref: 踩次数}, {...}, ...]*/
            //console.log(msg);   //成功则会打印当前后台所保存的数据
			var obj=eval(msg);  //将非标准的json转换成对象
			/*要使刷新内容不会消失，那就只有从后台中一条条的拿到数据重新显示在页面中*/
			$.each(obj,function(index,value){
                var message=createMsg(value);
                $('.messageLists').append(message);   //将添加的message标签添加到评论框标签中
                message.get(0).obj=value;  //这是为了把每一条数据对象保存为message标签的一个属性，以便后面使用
			})
        },
		error:function(xml){
            console.log(xml.status);
        }
	})
}
getMessageList(1);

//功能一：监听文本框的内容创建评论框message标签
	//1.1获得当前时间当前时间,创建评论的标签
function curTime(time){
	var currentTime=[];
	var date=new Date(time*1000);
	var Y=date.getFullYear();
	var M=date.getMonth()+1;
	var D=date.getDate();
	var h=date.getHours();
	var m=date.getMinutes();
	var s=date.getSeconds();
	h<10?h='0'+h:h;
	m<10?m='0'+m:m;
	s<10?s='0'+s:s;
	currentTime.push(Y+'-'+M+'-'+D);
	currentTime.push(h+':'+m+':'+s);
	return currentTime.join(" ");
};
function createMsg(obj){
    return $('<div class="message"><p class="Text">'+obj.content+'</p><div class="info"><span class="infoTime">'
        +curTime(obj.time)+'</span><span class="infoHandle"><a href="javascript:;" class="ding">'+obj.acc
        +'</a><a href="javascript:;" class="cai">'+obj.ref+'</a><a href="javascript:;" class="shan">删除</a></span></div></div>')
}

	//1.2点击发布，创建message评论框标签，并保存在后台
$('.btn').on('click',function(){
	var $text=$('.comment').val();  //获取文本框输入的内容
		//1.2.1将要发布的内容通过ajax传给远程的服务器,而创建的message标签里面的text最好从服务器里面找
			/*weibo.php?act=add&content=xxx	添加一条*/
	$.ajax({
		type:'GET',
		url:'weibo.php',
		data:'act=add&content='+$text,
		success:function(msg){
            /*{error: 0, id: 2, time: 1542372368, acc: 0, ref: 0}
            {error: 0, id: 新添加内容的ID, time: 添加时间, acc: 点赞数, ref: 点踩数*/
			var obj=eval("("+msg+")");  //将非标准的msg转换为对象，obj对象保存了这条评论的text、time、acc、ref
			obj.content=$text;    			//把用户输入的数据传给obj的content属性
            var message=createMsg(obj);
            $('.messageLists').prepend(message);   //将添加的message标签添加到评论框标签中
            $('.comment').val('');
            btnStyle();         //发布之后textarea的内容应该自动清空,且按钮不可用
            message.get(0).obj=obj;  //这是为了把obj保存为message标签的一个属性，以便后面使用
            getmsgPage();       //每发布一条评论都要重新的获取页码
            //每发布一条评论都要计算一下，每页不超过5条
            if($('.message').length>5){
                $('.message:last-child').remove();
            }

        },
		error:function(xml){
			console.log(xml.status);
		}
	})

});

//功能二：监听顶踩删标签功能,每点击一次后台则会记录顶、踩的个数并保存或者后台删除该id，这样一刷新从后台拿出来的数据也不会变
	//2.1点击顶标签,第一次点就是顶，再点就是取消顶(事件委托)
$('body').delegate('.ding','click',function(){
	var $this=$(this);
	var dingNum=$this.html();
	var id=$(this).parents('.message').get(0).obj.id;
    dingNum++;
    $this.html(dingNum);
    $.ajax({
		/* weibo.php?act=acc&id=12	*/
        type:'get',
        url:'weibo.php',
        data:'act=acc&id='+id,   //最好把id保存在创建的message标签中
        success:function(msg){
            console.log(msg);
        },
        error:function(xml){
            console.log(xml.status);
        }
    });
})
	//2.2点击踩标签,第一次点就是顶，再点就是取消顶(事件委托)
$('body').delegate('.cai','click',function(){
	var $this=$(this);
	var dingNum=$this.html();
    var id=$(this).parents('.message').get(0).obj.id;
    dingNum++;
    $this.html(dingNum);
    $.ajax({
		/* weibo.php?act=acc&id=12	*/
        type:'get',
        url:'weibo.php',
        data:'act=ref&id='+id,   //最好把id保存在创建的message标签中
        success:function(msg){
            console.log(msg);
        },
        error:function(xml){
            console.log(xml.status);
        }
    });
})
	//2.3点击删标签(事件委托),注意删除之后下页的内容要顶上来，重新getMessageList一下
$('body').delegate('.shan','click',function(){
	var $this=$(this);
	$this.parents('.message').remove();
    var id=$(this).parents('.message').get(0).obj.id;
    $.ajax({
		/* weibo.php?act=acc&id=12	*/
        type:'get',
        url:'weibo.php',
        data:'act=del&id='+id,   //最好把id保存在创建的message标签中
        success:function(msg){
            console.log(msg);
        },
        error:function(xml){
            console.log(xml.status);
        }
    });
    var page=$('.cur').html();   //获取要删除的评论所在的页面
    getMessageList(page);

})


//功能四：分页,获取页数,页面加载开始就要获取页数，并且每发布一条评论也要重新的获取一下页码
    //4.1:获取当前有几页的数据,动态的去创建页码(注意每发布一条评论都要重新的获取页码)
function getmsgPage(){
    $('.page').html('');   //创建页码之前要清空一下
    /*weibo.php?act=get_page_count
    返回：{count:页数}*/
    $.ajax({
        type:'get',
        url:'weibo.php',
        data:'act=get_page_count',
        success:function(msg){
            //console.log(msg);
            var obj=eval("("+msg+")");
            //动态的创建每一条页码的a标签
            for(var i=0;i<obj.count;i++){
                var a=$('<a href="javascript:;"></a>');
                a.html(i+1);
                if(i==0){
                    a.addClass('cur');
                }
                $('.page').append(a);
            }
        },
        error:function(xml){
            console.log(xml.status);
        }
    })
}
getmsgPage();
    //4.2：监听每页的数据getMessageList(page)
$('body').delegate('.page>a','click',function(){
    var page=$(this).html();   //获得当前点击的是第几页
    console.log(page);
    //$('.messageLists').html('');  //先清空所有的评论标签,把他放到getMessageList里面跟好些，每次切换或者刷新都先清空一下
    getMessageList(page);    //再显示当前页面数据
    $(this).addClass('cur');
    $(this).siblings().removeClass('cur');
})




