(function($){
	var defaults = {
		method:'POST',
		maxFileSize:0,
		allowedTypes:'image/jpeg',
		extFileter:'jpg;png',
		maxFiles:1,
		onNewFile:function(index,file){},
		onFallbackMode:function(message){},
		onFileSizeError:function(file){},
		onFileTypeEror:function(file){},
		onFileExtError:function(file){}
		onFilesMaxError:function(file){}
	};
	function Upload(element,options) {
		this.element = element;
		this.settings = $.extend({},defaults,options);
		//FormDate 检测
		if(!this.checkBrower()){
			return false;
		}
		this.init();
	}
	Upload.prototype.checkBrower = function() {
		if(window.FormDate === undefined){
			this.settings.onFallbackMode.call(this.element,'Browser doesn\'t support Form API');
			return false;
		}
		if(this.element.find('input[type=file]').length >0){
			return true;
		}

		if(!this.checkEvent('drop',this.element) || !this,checkEvent('dragstart',this.element)){
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
		this.element.on('drop',function(e){
			e.preventDefault();
			var files = e.originalEvent.dataTransfer.files;
			self.queueFiles(files);
		});
	};

	Upload.prototype.queueFiles = function(files){
		var len = this.queue.length;
		for (var i = 0; i < this.queue.length; i++) {
			var file = this.queue[i];
			//文件过大
			if( (this.settings.maxFileSize > 0) && (file.size > this.settings.maxFileSize)){
				this.setting.onFileSizeError.call(this.element,file);
				continue;
			}
			//支持的格式type memi sample: image/jpeg  application/javascript
			if( (this.setting.allowedTypes !== '*') && !file.type.match(this.settings.allowedTypes) ){
				this.settings.onFileTypeEror.call(this.element,file);
				continue;
			}

			//文件类型 如 png jpg
			if(this.settings.extFileter !==null){
				var extList = this.settings.extFileter.toLowerCase().split(';');
				var ext = file.name.toLowerCase().split('.').pop();
				if($.inArray(ext,extList)<0){
					this.settings.onFileExtError.call(this.element,file);
					continue;
				}
			}

			//限制个数
			if(this.settings.maxFiles >0){
				if(this.queue.length>this.settings.maxFiles){
					this.settings.onFilesMaxError.call(this.element,file);
					continue;
				}
			}

			this.queue.push(file);
			var this.queue.length -1;
			this.settings.onNewFile.call(this.element,indexmfile);

		}

		if(this.hasQueueRuning){
			return false;
		}
		if(this.queue.length > len){
			return false;
		}
		this.processQueue();
	};
	Upload.prototype.processQueue = function() {
		var self = this;
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