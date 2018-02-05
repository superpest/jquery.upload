/**
*	author: superpest
*	url: https://github.com/superpest/jquery.upload
*       version: v0.1 Beta
*/	

(function($){
	var defaults = {
		url:document.URL,
		method:'POST',
		dataType:'json',
		maxFileSize:2048*1024, //限制大小 单位是b， 1M = 1024*1024
		allowedTypes:'*',//文件类型 image/jpeg
		extFileter:null, //文件后缀格式 多个使用;分开 如jpg;png
		maxFiles:1, //最多上传个数
		extraData:{}, //附带的数据 {} 格式
		fileName:'file', //文件的name值
		onInit:function(msg){}, //事件监听成功
		onNewFile:function(index,file){}, //选择添加文件正确
		onFallbackMode:function(message){}, //浏览器检测结果
		onFileSizeError:function(file){}, //文件太大
		onFileTypeError:function(file){}, //文件类型不对
		onFileExtError:function(file){}, //文件格式不对
		onFilesMaxError:function(file){}, //文件数量不对
		onComplete:function(element){}, //上传ajax完成
		onBeforeUpload:function(id){}, //开始上传前
		onUploadProgress:function(id,percent){}, //开始上传时  可做进度条
		onUploadSuccess:function(id,data){}, //上传成功
		onUploadError:function(id,msg){} //上传错误
	};
	function Upload(element,options) {
		this.element = $(element);
		this.settings = $.extend({},defaults,options);
		//FormDate drag 检测
		if(!this.checkBrower()){
			return false;
		}
		this.init();
	}
	Upload.prototype.checkBrower = function() {
		if(window.FormData === undefined){
			this.settings.onFallbackMode.call(this.element,'Browser doesn\'t support Form API');
			return false;
		}

		if(!this.checkEvent('drop',this.element) || !this.checkEvent('dragstart',this.element)){
			this.settings.onFallbackMode.call(this.element,'Browser doesn\'t support Drag and Drop');
			return false;
		}
		return true;
	};
	 Upload.prototype.checkEvent = function(eventName,element) {
	 	//检测事件属性
	 	var element = element || document.createElement('div');
	 	var eventName = 'on' + eventName;
	 	var isSupported = eventName in element;
	 	if(!isSupported){
	 		if(!element.setAttribute){
	 			element = document.createElement('div');
	 		}
	 		if(element.setAttribute && element.removeAttribute){
	 			element.setAttribute(eventName,'');
	 			isSupported = typeof element[eventName] === 'function';

	 			if(typeof element[eventName] !== 'undefined'){
	 				element[eventName] = undefined;
	 			}

	 			element.removeAttribute(eventName);
	 		}
	 	}
	 	element = null;
	 	return isSupported;
	 }

	Upload.prototype.init = function() {
		var self = this;
		this.queue = [];
		this.queuePosition = -1;
		this.hasQueueRuning = false;
		if(this.element.find('input[type=file]').length >0){
			this.settings.onInit.call(this.element,'ok');
		}else{
			this.settings.onInit.call(this.element,'not found input');
			return false;
		}
		this.element.on('drop',function(e){
			e.preventDefault();
			var files = e.originalEvent.dataTransfer.files;
			self.queueFiles(files);
		});
		this.element.find('input[type=file]').on('change',function(e){
			var files = e.target.files;
			self.queueFiles(files);
			$(this).val('');
		});
		
	};

	Upload.prototype.queueFiles = function(files){
		var len = this.queue.length;
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			
			//支持的格式type memi sample: image/jpeg  application/javascript
			if( (this.settings.allowedTypes !== '*') && !file.type.match(this.settings.allowedTypes) ){
				this.settings.onFileTypeError.call(this.element,file);
				continue;
			}

			//文件类型 如 png jpg  与上面的选项二选一就好。
			if(this.settings.extFilter !==null){
				var extList = this.settings.extFilter.toLowerCase().split(';');
				var ext = file.name.toLowerCase().split('.').pop();
				if($.inArray(ext,extList) ===-1 ){
					this.settings.onFileExtError.call(this.element,file);
					continue;
				}
			}

			//文件过大
			if( (this.settings.maxFileSize > 0) && (file.size > this.settings.maxFileSize)){
				this.settings.onFileSizeError.call(this.element,file);
				continue;
			}

			//限制个数
			if(this.settings.maxFiles >0){
				if(this.queue.length>this.settings.maxFiles-1){
					this.settings.onFilesMaxError.call(this.element,file);
					continue;
				}
			}

			this.queue.push(file);
			var index = this.queue.length -1;
			this.settings.onNewFile.call(this.element,index,file);

		}

		if(this.hasQueueRuning){//选择上传后，要上传完毕 才允许再次选择上传
			return false;
		}
		if(this.queue.length === len){
			return false;
		}
		this.processQueue();
	};
	Upload.prototype.processQueue = function() {
		var self = this;
		this.queuePosition++; //依次上传
		if(this.queuePosition >= this.queue.length){
			this.settings.onComplete.call(this.element);
			this.queuePosition = this.queue.length -1;
			this.hasQueueRuning = false;
			return false;
		}

		var file = this.queue[this.queuePosition];
		var fd = new FormData();  
		fd.append(this.settings.fileName,file);
		var isContinue =  this.settings.onBeforeUpload.call(this.element,this.queuePosition);
		if(isContinue===false){
			return false;
		}
		//添加其他的表单属性
		$.each(this.settings.extraData,function(key,val){
			fd.append(key,val);
		});

		this.hasQueueRuning = true;
		$.ajax({
			url:this.settings.url,
			type:this.settings.method,
			dataType:this.settings.dataType,
			data:fd,
			cache:false,
			contentType:false,
			processData:false,
			forceSync:false,
			xhr:function(){
				var xhr = $.ajaxSettings.xhr();
				if(xhr.upload){
					xhr.upload.addEventListener('progress',function(e){
						var percent = 0;
						var position = e.loaded || e.position;
						var total = e.total || e.totalSize;
						if(e.lengthComputable){
							percent = Math.ceil(position/total*100);
						}
						self.settings.onUploadProgress.call(self.element,percent);
					},false);
				}
				return xhr;
			},
			success:function(res,msg,xhr){
				self.settings.onUploadSuccess.call(self.element,self.queuePosition,res);
			},
			error:function(xhr,status,errMsg){
				self.settings.onUploadError.call(self.element,self.queuePosition,errMsg);
			},
			complete:function(xhr,textStatus){
				self.processQueue();
			}
		})
	}
	$.fn.upload = function(options){
		// return this;
		return this.each(function(){
			if(!$.data(this,'upload')){
				$.data(this,'upload',new Upload(this,options));
			}
		});

	};

	//拖拽时禁止打开文件
	$(document).on('dragenter drop dragover',function(e){
		return false;
	});
})(jQuery);
