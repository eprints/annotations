var anno_data = new Object;

// call to initialise the annotations code when the document is ready
jQuery( document ).ready(function()
{
  if( ep_annotations_enable )
  {
    if( ep_annotations_enable_page ) { anno_init_page(); }
    if( ep_annotations_enable_workflow ) { anno_init_workflow(); }
  }
});

// initialise annotation, bail if we are not in a suitable context, ansynchronously call anno_init_workflow2
function anno_init_workflow()
{
  if( !eprints_logged_in )
  {
    return;
  }

  // assume eprint dataset, unless another dataset is specified

  anno_data["_dataset"] = jQuery("#dataset").attr("value");
  if( !anno_data["_dataset"] )
  {
    anno_data["_dataset"] = "eprint"; // for now
  }

  anno_data["_id"] = jQuery("#dataobj").attr("value");
  if( !anno_data["_id"] )
  {
    anno_data["_id"] = jQuery("#eprintid").attr("value");
  }

  //console.log( "dataset:" + anno_data["_dataset"] );
  //console.log( "dataobj:" + anno_data["_id"] );

  if( anno_data["_id"] && anno_data["_dataset"] )
  {
    var record = anno_data["_dataset"] + "/" + anno_data["_id"];

    jQuery.getJSON("/cgi/anno/get?record="+record, function(data){
      jQuery.each(data, function (index, value) {
        anno_data[ value[ "key" ] ] = value[ "note" ];
      });
      anno_init_workflow2();
    });
  }
  else
  {
    //console.log("not using annotations");
    // do nothing
  }
}

// match workflow components and add in hooks for managing annotations
function anno_init_workflow2()
{
  jQuery("div[class='ep_sr_component']").each(function( index ) {
    var a = jQuery(this).find("a:nth-child(2)");
    var field = a.attr("name");

    var title = field;
    var title1 = jQuery(this).find(".ep_sr_title").find(".ep_no_js").text();
    var title2 = jQuery(this).find(".ep_sr_title").text();
    if( title1.length > 0 ) { title = title1; }
    if( title1.length == 0 && title2.length > 0 ) { title = title2 }

/*
    // experimental tagging at a field level, we really need to write hooks in at the workflow page generation stage
    // this is always going to have a hard time coping with dynamic components like when 'more input rows' is pressed
    console.log(this);
    var num_fields = jQuery(this).children("a").length - 1; // -1 as container has one too
    if( num_fields > 1 || num_fields == 0 ) // its a multi or its a single but might be compound
    {
      var c;
      jQuery(this).children("a").each(function( index ) {
        var name = jQuery(this).attr("name");
        if( index == 0 ) { c = name }
        else
        {
          jQuery('td[id^="' + c + '_' + name + '_cell_"]').each(function( index ) {
            console.log("id=" + jQuery(this).attr("id"));
            var l = "<div class='ep_anno_popup_link' style='margin-top: 0;' onclick='anno_popup(\"" +name+ "\")'>[mc1]<img src='/images/anno/anno.png' alt='[A]'></div>";
            jQuery(this).append( l );
          });

          var t = "#" + c + "_" + name + "_cell_0_0";
          var l = "<div class='ep_anno_popup_link' style='margin-top: 0;' onclick='anno_popup(\"" +name+ "\")'>[mc2]<img src='/images/anno/anno.png' alt='[A]'></div>";
          jQuery(t).append( l );
        }
      });
    }
*/

    // misses ep_multi_input, offers annotations at a per workflow component for now
    // console.log( "ep_sr_component: " + a.attr("name") + " title=" + title);
    jQuery(this).append( "<div id='dialog_"+field+"' class='anno_dialog' title='Notes for \""+title.trim()+"\"'><textarea id='data_"+field+"'rows=10 cols=40></textarea></div>" );
    jQuery("#data_"+field).val( anno_data[ field ] );
    jQuery( "#dialog_" + field ).dialog(
    {
      modal: true,
      open: function(event, ui) {
        // console.log("open");
      },
      close: function(event, ui) {
        jQuery("#dialog").hide();
        var new_val = jQuery("#data_"+field).val();
        if( !anno_data[ field ] ) { anno_data[ field ] = ""; }
        if( anno_data[ field ] != new_val )
        {
          // console.log( anno_data[ field ] + " -> " + new_val );
          anno_data[ field ] = new_val;
          anno_send( field );
        }
        // console.log("close");
      }
    });
    jQuery( "#dialog_" + field ).dialog("close");
    var img = "anno.png";
    if( anno_data[ field ] ) { img = "anno-green.png"; }
    var anno_link = "<div class='ep_anno_popup_link' onclick='anno_popup(\"" +field+ "\")'><img src='/images/anno/"+img+"' alt='[A]'></div>";
    jQuery(this).append( anno_link );
    // jQuery(this).parent().prev().find(".ep_sr_content").append( anno_link ); // likely very unreliable! // adds to next one up, oops!
    // jQuery(this).parent().prev().find(".ep_sr_content").append( anno_link ); // likely very unreliable!
  });
}

// send annotation back to server
function anno_send( field )
{
  var dataset = anno_data["_dataset"];
  var objectid = anno_data["_id"];
  var record = dataset + "/" + objectid;
  var note = anno_data[ field ];
  var security = ep_annotations_workflow_security;
  jQuery.post( "/cgi/anno/put", { record: record, key: field, note: note, security: security } );
}

// open up a modal dialog to add/edit simple text
function anno_popup( s )
{
  jQuery('#dialog_'+s).dialog('open');
}


// page level annotations, not cgi pages

var anno_page_data = "";

function anno_init_page()
{
  var record = window.location.pathname;
  if( !eprints_logged_in || record.startsWith("/cgi/") )
  {
    return;
  }

  jQuery.getJSON("/cgi/anno/get?type=simple&record="+record, function(data) {
    jQuery.each(data, function (index, value) {
      // anno_page_data[ value[ "key" ] ] = value[ "note" ];
      anno_page_data = value[ "note" ]; // just assume one for now
    });
    anno_init_page2( record );
  });
}

function anno_init_page2(record)
{
  var target = jQuery( "body" );

  jQuery(target).append( "<div id='dialog_page' class='anno_dialog' title='Shared notes for this page'><textarea id='anno_page' rows=10 cols=40></textarea></div>" );
  jQuery("#anno_page").val( anno_page_data );
  jQuery( "#dialog_page" ).dialog(
  {
    modal: true,
    open: function(event, ui) {
      // console.log("open");
    },
    close: function(event, ui) {
      jQuery("#dialog_page").hide();
      var new_anno_page_data = jQuery("#anno_page").val();
      if( anno_page_data != new_anno_page_data )
      {
        anno_page_data = new_anno_page_data;
        jQuery.post( "/cgi/anno/put", { record: record, key: "page", note: anno_page_data, security: ep_annotations_page_security } );
      }
    }
  });

  jQuery( "#dialog_page" ).dialog("close");
  var img = "anno.png";
  if( anno_page_data ) { img = "anno-green.png"; }
  var anno_link = "<div class='ep_anno_page_popup_link' onclick='jQuery(\"#dialog_page\").dialog(\"open\");'><img src='/images/anno/"+img+"' alt='[A]' title='Shared notes for this page'</div>";
  jQuery(target).prepend( anno_link );
}

// threaded discussion support

function anno_init_discuss( record, target )
{
  if( ep_annotations_enable && ep_annotations_enable_discuss )
  {
    var existing_content = jQuery( target ).html();
    jQuery( target ).html(existing_content + "<span class='ep_discussion_message'>Please <a href='/cgi/users/home'>login</a> to access discussions.</span>");
    jQuery.getJSON("/cgi/anno/get?type=threaded&record="+record, function(data) {
      jQuery( target ).empty();
      jQuery.each(data, function (index, value) {
        anno_render_note( target, index, value );
      });
      anno_init_discuss2( record, target );
      jQuery(target).prepend( existing_content );
    });
  }
}

var anno_discuss_initialised = false;
function anno_init_discuss2( record, target )
{
  jQuery(target).append( "<div id='dialog_page_discuss' class='anno_dialog' title='Add to the discussion'><div id='anno_page_discuss_pre'></div><textarea id='anno_page_discuss' rows='10' cols='40'></textarea></div>" );
  jQuery( "#dialog_page_discuss" ).dialog(
  {
    modal: true,
    open: function(event, ui) {
      jQuery("#anno_page_discuss_pre").html( jQuery( "#dialog_page_discuss" ).data("subject") );
//      var info_text = jQuery( "#dialog_page_discuss" ).attr("info");
//      if( info_text )
//      {
//       jQuery("#anno_page_discuss_pre").html( info_text );
//        // jQuery("#anno_page_discuss").val( info_text );
//      }
    },
    close: function(event, ui) {
      jQuery("#dialog_page_discuss").hide();
      var data = jQuery("#anno_page_discuss").val(); // is this correct?
//      var info_text = jQuery( "#dialog_page_discuss" ).attr("info");

      // if( data.length > 0 && /\S/.test(data) && data != info_text )
      if( data.length > 0 )
      {
//        if( info_text && info_text.length > 0 )
//        {
//          data = "[" + info_text + "]\n" + data;
//        }
        var new_value = { record: record, key: "discuss", note: data, type: "threaded", verb: "create", security: ep_annotations_discuss_security };
        // copy the data attributes into the new value array
        var od = jQuery( "#dialog_page_discuss" ).data();
        jQuery.each( od, function(k,v)
        {
          if( typeof v === "string" || typeof v === "number" )
          {
            // console.log("2 " + k + "=" + v);
            new_value[ k ] = v;
          }
        });

        jQuery.post( "/cgi/anno/put", new_value, function(data)
        {
          jQuery.each(data, function (index, value) { // should	only be	1  
            anno_render_note( jQuery(target), index, value );
          });
        }, 'json' );
        jQuery("#anno_page_discuss").val("");
        jQuery("#anno_page_discuss").attr("info", ""); // have to set each time via anno_dialog_open_with
      }
    }
  });

  jQuery( "#dialog_page_discuss" ).dialog("close");
  var img = "anno.png";
  if( anno_page_data ) { img = "anno-green.png"; }

  if( eprints_logged_in )
  {
    var anno_link = "<div class='ep_anno_page_discuss_link' id='ep_anno_page_discuss_new' onclick='jQuery(\"#dialog_page_discuss\").dialog(\"open\");'>New <img src='/images/anno/"+img+"' alt='[A]' title='Discussions'/></div>";
    jQuery(target).prepend( anno_link );
  }
  else
  {
    jQuery(target).prepend( "<span class='ep_discussion_message'>Please <a href='/cgi/users/home'>login</a> to comment.</span>" );
  }

  anno_discuss_initialised = true;
}

function anno_render_note( target_p, index, value )
{
  var target = target_p;
  if( value["info"] )
  {
    var info = JSON.parse( value["info"] );
    if( info && info["inreplyto"] )
    {
      target = jQuery("#anno_discuss_" + info["inreplyto"]);
    }
  }

  var id = value["annoid"];
  var r = "";

  r += "<div class='anno_dialog' id='dialog_del_"+id+"' title='Delete'>Permanently delete this comment?</div>";
  r += "<div class='anno_dialog' id='dialog_edit_"+id+"' title='Edit'><div id='dialog_edit_pre_"+id+"'></div><textarea id='dialog_edit_ta_"+id+"' rows='10' cols='40'></textarea></div>";
  r += "<div class='anno_dialog' id='dialog_reply_"+id+"' title='Reply'><textarea id='dialog_reply_ta_"+id+"' rows='10' cols='40'></textarea></div>";
  r += "<div class='ep_anno_discuss' id='anno_discuss_"+value["annoid"]+"'><div class='ep_anno_note' id='anno_discuss_note_"+id+"'>"+value["note"]+"</div>";
  r +=   "<div class='ep_anno_control'>";
  r +=     "<span style='font-size: 85%; vertical-align: text-top; font-style: italic;'>"+info["username"]+" - "+info["time"]+" </span>";

  if( eprints_logged_in && ( info["userid"] == eprints_logged_in_userid || eprints_logged_in_usertype == "admin" || eprints_logged_in_usertype == "local_admin" ) )
  {
    r +=   "<a onclick='jQuery(\"#dialog_del_"+id+"\").dialog(\"open\");'><img src='/images/anno/del.png' alt='[del]' title='Delete'/></a>";
    r +=   "<a onclick='jQuery(\"#dialog_edit_"+id+"\").dialog(\"open\");'><img src='/images/anno/anno-green.png' alt='[edit]' title='Edit'/></a>";
  }
  if( eprints_logged_in )
  {
    r +=   "<a onclick='jQuery(\"#dialog_reply_"+id+"\").dialog(\"open\");'><img src='/images/anno/reply.png' alt='[reply]' title='Reply'/></a>";
  }

  r +=   "</div>";
  r += "</div>";

  // jQuery(target).append(r); // oldest first

  // show newest first, but show oldest replies first
  if( info["inreplyto"] )
  {
    jQuery(target).append(r);
  }
  else
  {
    jQuery(target).prepend(r);
    jQuery(target).prepend( jQuery( "#ep_anno_page_discuss_new" ) ); // move 'New' to the top
  }

  // add all the info fields as data attributes to the annotation div
  for(var k in info)
  {
//console.log("adding info to #anno_discuss_" + id + " : " + k + " = " + info[k]);
    jQuery("#anno_discuss_" + id).data( k, info[k] );
    jQuery("#anno_discuss_" + id).attr( "debug_" + k, info[k] );
  }

  // debug
/*
  var f = jQuery("#anno_discuss_" + id).data( "file" );
  var o = jQuery("#anno_discuss_" + id).data( "offset" );
  if( f && o )
  {
     jQuery("#anno_discuss_" +id).append( "<span style='font-size:60%;'>["+f+"@"+o+"]</span>" );
  }
*/

  jQuery( "#dialog_del_" + id ).dialog(
  {
    modal: true,
    buttons: {
      "Delete": function() {
        jQuery.get( "/cgi/anno/del?id=" + id );
        jQuery(this).dialog("close");
        jQuery("#anno_discuss_" + id).remove();
      },
      "Cancel": function() { jQuery(this).dialog("close"); }
    }
  });
  jQuery( "#dialog_del_" + id ).dialog("close");

  jQuery( "#dialog_edit_" + id ).dialog(
  {
    modal: true,
    open: function(event, ui) {
      //console.log( id + " subject " + jQuery( "#anno_discuss_" + id).data("subject") );
      jQuery("#dialog_edit_pre_"+id).html( jQuery( "#anno_discuss_" + id).data("subject") );
    },
    close: function(event, ui) {
      var data = jQuery( "#dialog_edit_ta_" + id).val();
      if( data.length > 0 )
      {
        value["note"] = data;
        value["verb"] = "edit";
        value["id"] = id;
        jQuery.post( "/cgi/anno/put", value );
        jQuery( "#anno_discuss_note_" + id ).replaceWith( data ); // local update
      }
    }
  });
  jQuery( "#dialog_edit_" + id ).dialog("close");
  jQuery( "#dialog_edit_ta_" + id).val( value["note"] );

  jQuery( "#dialog_reply_" + id ).dialog(
  {
    modal: true,
    close: function(event, ui) {
      var data = jQuery( "#dialog_reply_ta_" + id).val();
      if( data.length > 0 )
      {
        var new_value = { record: value["record"], key: value["key"], note: data, type: value["type"], verb: "create", inreplyto: value["annoid"] };
        jQuery.post( "/cgi/anno/put", new_value, function(data)
        {
          jQuery.each(data, function (index, value) { // should only be 1
            anno_render_note( jQuery(target), index, value );
          });
        }, 'json' );
      }
    }
  });
  jQuery( "#dialog_reply_" + id ).dialog("close");

}

// opens up the dialog with the specified key=value pair set in the dialog
function anno_dialog_open_with( id, anno_attr )
{
  for(var k in anno_attr)
  {
    // console.log(id + ":" + k + " -> " + anno_attr[k]); 
    jQuery( id ).data( k, anno_attr[k] );
  }
  jQuery( id ).dialog( "open" );
}
