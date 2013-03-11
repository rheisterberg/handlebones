
window.Application = {View:{}};

$(function() {
    
    $.getJSON('televisions.json',null,function(items) {

        items.types = {},items.brands = {};items.sizes = {};
        items.forEach(function(item) {

            items.types[item.type] = item.type;
            items.brands[item.brand] = item.brand;
            items.sizes[item.size] = item.size;
            
            item.descrip = item.description.split(/<li>/i).slice(1).join(', ');
            
            item.dollars = Math.floor(item.price);
            item.cents = Math.floor(100 + Math.round(100*(item.price - item.dollars))).toString().substring(1);
            
            item.stars = Math.floor(Math.max(0,(Math.min(5,parseFloat(item.rating)))*20)).toString().concat('px');

        });
        
        items.types = Object.keys(items.types).sort();
        items.brands = Object.keys(items.brands).sort();
        items.sizes = Object.keys(items.sizes).sort();
        
        // Breadcrumbs
    
        var BreadcrumbsView = Application.View['breadcrumbs'] = Backbone.View.extend({
          render: function() {
            var context = this.model ? this.model.attributes : {},
                output = this.options.template(context);
            this.$el.html(output);
          }
        });
    
        var model = new Backbone.Model({
            home: 'http://www.walmart.com',
            crumbs: [
                { name:'DEPARTMENTS', href:'http://www.walmart.com/departments'},
                { name:'ELECTRONICS', href:'http://www.walmart.com/electronics'},
                { name:'TV\'S', href:'http://www.walmart.com/tvs'},
    
            ]
        });
    
        var view = new Application.View['breadcrumbs']({ template: Handlebars.templates['breadcrumbs'], model: model });
        view.render();
    
        $('.gh-crumbs').replaceWith(view.el.firstChild);
    
        // Slider
    
        var SliderHandle = Application.View['SliderHandle']  = Backbone.View.extend({
    
            initialize: function() {
    
                var self = this,context = self.model;
    
                self.$el = $('<div class="hdl"/>').appendTo(context.target);
                self.$el.toggleClass('ds',context.disabled || false);
        
                self.ondragstop = self.onDragStop.bind(self);
                self.ondragmove =  self.onDragMove.bind(self);
        
                self.$el.bind('click',self.onCancel.bind(self));
                self.$el.bind('dragstart',self.onCancel.bind(self));
        
                self.$el.bind('mousedown',self.onDragStart.bind(self));
    
            },
    
            detached:true,
            
            move : function(position) {
                var self = this,parent = self.$el.parent(),target = self.$el,half = Math.floor(self.$el.width()/2);
                target.css({left:Math.round((self.position = Math.min(Math.max(0,position),parent.width()))) - half});
                return position;
            },
            
            onCancel : function(event) {
                return false;
            },
            
            onDragStart : function(event) {
            
                var self = this,disabled = self.disabled;
                if (disabled) return false;
            
                var offset = self.$el.position();
                self.eventLeft = event.clientX - offset.left;;
                self.$el.toggleClass('drag');
            
                $(document).bind('mouseup',self.ondragstop);
                $(document).bind('mousemove',self.ondragmove);
            
                self.disableSelect($(document.body));
            
            },
            
            onDragMove : function(event) {
                var self = this,half = Math.floor(self.$el.width()/2);
                self.move(self.model.onDrag(event.clientX - self.eventLeft + half));
                return false;
            },
            
            onDragStop : function(event) {
            
                var self = this,onStop = self.onStop;
                if (onStop) self.move(onStop(self.position));
                self.$el.toggleClass('drag');
            
                $(document).unbind('mouseup',self.ondragstop);
                $(document).unbind('mousemove',self.ondragmove);
            
                self.enableSelect($(document.body));
            
            },
    
    		//> public void disableSelect(Object elem)
    		disableSelect: function(elem) {
    
    			if (document.all) {
    				elem.bind('dragstart selectstart',this.cancelSelect.bind(this));
    			}
    			else {
    				elem.css({'-webkit-user-select':'none','-moz-user-select':'none','user-select':'none'});
    			}
    
    		},
    
    		//> public void enableSelect(Object elem)
    		enableSelect: function(elem) {
    
    			if (document.all) {
    				elem.unbind('dragstart selectstart');
    			}
    			else {
    				elem.css({'-webkit-user-select':'','-moz-user-select':'','user-select':''});
    			}
    
    		},
    
    		cancelSelect : function(event) {
    			return false;
    		}
    
        });
    
        var SliderRange = Application.View['SliderRange']  = Backbone.View.extend({
    
            className : 'slider',
            
            render : function(target) {
    
                var self = this,context = self.model ? self.model.attributes : {};
                target.replaceWith(self.$el.html(self.options.template(context)));
    
                var disabled = context.disabled || false;
        
                self.range = $('.range',self.$el);
                self.bar = $('.bar',self.range).toggleClass('ds',disabled);
                self.range.bind('click',self.onClick.bind(self));
        
                self.left = new SliderHandle({model:{onDrag:self.onMinDrag.bind(self),onStop:self.onMinStop.bind(self),target:self.range,disabled:disabled}});
                self.right = new SliderHandle({model:{onDrag:self.onMaxDrag.bind(self),onStop:self.onMaxStop.bind(self),target:self.range,disabled:disabled}});
        
                self.label  = $('.label',self.$el);
                
                self.min = context.min;self.max = context.max;
                self.low = context.low;self.high = context.high;
                
                if (self.range.width()) self.layout();
        
            },
            
            layout : function(force) {
    
                var self = this;
    
                self.low = Math.max(self.low,self.min);
                self.high = Math.min(self.high,self.max);
    
                var left = self.position(self.low);self.left.move(left);
                var right = self.position(self.high);self.right.move(right);
    
                self.bar.css({'margin-left':Math.round(left),'margin-right':Math.round(self.range.width() - right)});
    
            },
    
            scale : function(position) {
                var self = this,range = self.range.width(),fraction = position/range;
                return Math.round(self.min + fraction*(self.max - self.min));
            },
    
            position : function(value) {
                var self = this,range = self.range.width();
                return range*((value - self.min)/(self.max - self.min));
            },
    
            format : function(value) {
                return value;
            },
    
            onClick : function(event) {
    
                var self = this,offset = self.range.offset();
                var position = event.pageX - offset.left;
    
                var left = self.left.position,right = self.right.position;
                if (position < left) self.onMinStop(self.left.move(position));
                else if (position > right) self.onMaxStop(self.right.move(position));
                else if ((position - left) < (right - position)) self.onMinStop(self.left.move(position));
                else self.onMaxStop(self.right.move(position));
    
            },
    
            onMinDrag : function(offset) {
    
                var self = this,range = self.range.width();
                var position = Math.min(Math.max(0,offset),self.right.position);
                self.left.$el.css({'z-index':1});self.right.$el.css({'z-index':0});
    
                //self.label.text(self.format(self.low = self.scale(position)) + ' - ' + self.format(self.high));
                self.bar.css({'margin-left':Math.round(position)});
    
                return position;
    
            },
    
            onMaxDrag : function(offset) {
    
                var self = this,range = self.range.width();
                var position = Math.min(Math.max(self.left.position,offset),range);
                self.left.$el.css({'z-index':0});self.right.$el.css({'z-index':1});
    
                //self.label.text(self.format(self.low) + ' - ' + self.format(self.high = self.scale(position)));
                self.bar.css({'margin-right':Math.round(range - position)});
    
                return position;
    
            },
    
            onMinStop : function(offset) {
                var self = this,position = self.onMinDrag(offset);
                self.publish('slider',{slider:'low',value:self.scale(position)});
                return position;
    
            },
    
            onMaxStop : function(offset) {
                var self = this,position = self.onMaxDrag(offset);
                self.publish('slider',{slider:'high',value:self.scale(position)});
                return position;
            }
    
        });
    
        var model   = new Backbone.Model({
            label:'Size',
            min:0,max:90,low:0,high:90
        });
    
        var view = new Application.View['SliderRange']({ template: Handlebars.templates['SliderRange'], model: model });
        view.render($('.slider'));
    
        // Filters
    
        Application.View['filter']  = Backbone.View.extend({
    
            className : 'filter',
    
            events: {
                'click .btn' : 'click',
                'click .opt' : 'select',
                'mouseleave .lyr' : 'mouseleave'
            },
    
            render: function() {
                var context = this.model ? this.model.attributes : {},
                output = this.options.template(context);
                this.$el.html(output);
            },
    
            click : function(event) {
                this.$el.find('.lyr').css({visibility:'visible'});
            },
    
            select : function(event) {
                this.$el.find('.btn .text').text($(event.target).text());
                this.$el.find('.lyr').css({visibility:'hidden'});
                event.stopPropagation();
            },
    
            mouseleave : function(event) {
                this.$el.find('.lyr').css({visibility:'hidden'});
                event.stopPropagation();
            }
    
        });
    
        var types = [{ name:'All Types', value:"0" }];
        items.types.forEach(function(type,index) {
            types.push({name:type,value:index + 1});
        });

        var model = new Backbone.Model({
              label:'Type',
              value:'All Types',
              options: types
        });
    
        var view = new Application.View['filter']({ template: Handlebars.templates['filter'], model: model });
        view.render();
    
        $('.filters').append(view.el);
    
        var brands = [{ name:'All Brands', value:"0" }];
        items.brands.forEach(function(type,index) {
            brands.push({name:type,value:index + 1});
        });

        var model = new Backbone.Model({
              label:'Brand',
              value:'All Brands',
              options: brands
        });
    
        var view = new Application.View['filter']({ template: Handlebars.templates['filter'], model: model });
        view.render();
    
        $('.filters').append(view.el);
    
        var model = new Backbone.Model({
              label:'Sort',
              value:'Price',
              options: [
                { name:'Price', value:"0" },
                { name:'Rating', value:"1" },
                { name:'Size', value:"2" }
              ]
        });
    
        var view = new Application.View['filter']({ template: Handlebars.templates['filter'], model: model });
        view.render();
    
        $('.filters').append(view.el);
    
        // Items
    
        var ItemView = Application.View['item'] = Backbone.View.extend({
            
            className : 'item',
    
            render: function() {
                var context = this.model ? this.model.attributes : {};
                this.$el.html(this.options.template(context));
                return self;
            }
            
        });
        
        var ItemModel = Backbone.Model.extend({
        });
        
        var ItemModels = Backbone.Collection.extend({
            model : ItemModel
        });
    
        var ItemCollectionView = Application.View['items']  = Backbone.View.extend({
    
            initialize : function() {
    
                var self = this;
                self.itemViews = [];
                
                self.collection.each(function(item) {
                    self.itemViews.push(new ItemView({template:Handlebars.templates['item'],model:item}));
                });
            },
            
            render : function() {
                
                var self = this;
                // Clear out this element.
                self.$el.empty();
            
                // Render each sub-view and append it to the parent view's element.
                _(self.itemViews).each(function(view) {
                    view.render();
                    self.$el.append(view.$el);
                });
            }
    
        });
        
        var models = new ItemModels(items);
    
        var view = new ItemCollectionView({
            collection : models,
            el : $('.items')[0]        
        });
        
        view.render();
        
    });
    
});
