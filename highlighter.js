//jshint esnext: true
(function main () {
  /**
   * HSstudent16's Syntax highlighter - PJS port
   * 
   * This highlighter can parse:
   *  - Single & double quote strings
   *  - Regular Expressions
   *  - Single & multi-line comments
   *  - Methods & properties
   *  - ES6 class, async, etc. keywords
   *  - Escape characters & comment docs
   *  - Hexadecimal & floating-point numbers
   */
  let win = this, doc = win[["document"]];

  // Identifier tags;  A NULL character (\0) 
  // is used as a delimiter
  let regx = "\0regx\0",
      cmnt = "\0cmnt\0",
      strg = "\0strg\0",
      nmbr = "\0nmbr\0",
      prop = "\0prop\0",
      kywd = "\0kywd\0",
      end  = "\0end\0" ,
      valu = "\0valu\0",
      mthd = "\0mthd\0",
      oper = "\0oper\0",
      cdoc = "\0cdoc\0",
      escc = "\0escc\0";
  
  // The highlighting colors for each
  // These can be modified via the `colors`
  // property
  let colors = {
      "cmnt": "rgb(76,136,107)",
      "strg": "rgb(3,106,7)",
      "nmbr": "rgb(0,0,205)",
      "kywd": "rgb(0,0,205)",
      "valu": "rgb(49,132,149)",
      "oper": "rgb(104,118,135)",
      "regx": "rgb(3,106,7)",

      "cdoc": "rgb(0,102,255)",
      "escc": "rgb(104,118,135)",

      "prop": "rgb(50,50,150)",
      "mthd": "rgb(150,100,10)"
  };

  /**
   * Inserts raw HTML in place of identifiers
   * 
   * @param {string} txt identifier-filled string
   * @returns {string} An HTML string
   */
  function insertOpenSpan (txt) {
    // NOTE: colors are dumped directly into the <span> tag.
    // `.slice()` removes NULL characters
    return "<span style = 'color:" + 
            colors[txt.slice(1, 5)] + "'>";
  }

  /**
   * Identifies JavaScript syntax, and places delimiters for highlighting.
   * @param {string} inStr A plain JavaScript String
   * @returns {string} delimited JavaScript
   */
  function markupCode (inStr) {
    // Look for JS keywords, and add delimiters around them.
    let nxt = inStr.replace(
      /(?<!\w)(?:class|this|delete|async|default|throw|typeof|instanceof|with|new|void|function|import|in|of|for|while|do|var|let|const|try|catch|with|yeild|return|await|break|case|switch|continue|if|else)(?!\w)/g,
      kywd + "$&" + end
    );

    // Look for built-in values (true, false, etc.) and delimit them, too.
    nxt = nxt.replace(
      /(?<!\w)(?:true|false|undefined|Infinity|null)(?!\w)/g,
      valu + "$&" + end
    );

    // Look for properties, or words preceeded by a dot & not
    // followed by an openning parenthesis
    nxt = nxt.replace(
      /(?<=[A-z_$]\s*)[.]\s*[A-Za-z_$][A-Za-z0-9_$]*(?!\w|\s*[(])/g,
      prop + "$&" + end
    );

    // Look for methods;  just like properties, only an openning
    // parenthesis is expected.
    nxt = nxt.replace(
      /(?<=[A-z_$]\s*)[.]\s*[A-Za-z_$][A-Za-z0-9_$]*(?=\s*[(])/g,
      mthd + "$&" + end
    );

    // Look for a number, Hexadecimal or not.
    nxt = nxt.replace(
      /(?<!\w)(?:0x[0-9A-Fa-f]+|[0-9]+|[0-9]*[.][0-9]+)/g,
      nmbr + "$&" + end
    );
    
    // Look for operators (+, i, *, /, etc.)
    nxt = nxt.replace(
      /[+\-|]{1,2}|[=]{1,3}|(?<![*/])(?<=[0-9a-zA-Z$_]\s*)[/](?![*/])[=]?|(?<![/])[*](?![/])|[\^|%][=]?|&(?!gt|&lt);[=]?|[&](?![a-zA-Z]+;){1,2}|(?:&gt;|&lt;){1,3}[=]?|[~][=]?|[!][=]{0,2}|[>]{1,3}[=]?/g,
      oper + "$&" + end
    );

    // Look for a regular expression, with failsafe for comments
    nxt = nxt.replace(
      /(?<![*/])\/[^*/](?:[^\n\r/]|\\\/)+?\/(?:\0end\0)?[a-z]*/g,
      function (str) {

        // Remove prior formatting inside
        let rstr = str.replace(/\0(?:prop|kywd|nmbr|end|valu|mthd|oper)\0/g, '');
        return regx + rstr + end;
      }
    );

    // Look for a string
    nxt = nxt.replace(
      /"(?:[^\n\r]|\\")*?[^\\]"|'(?:[^\n\r]|\\')*?[^\\]'/g,
      function (str) {
        // Remove prior formatting inside
        let rstr = str.replace(
          /\0(?:prop|kywd|nmbr|regx|end|valu|mthd|oper)\0/g,
          ''
        );
        // Add delimiters for escape characters
        rstr = rstr.replace(
          /\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|[trn"']|\\)/g,
          escc + "$&" + end
        );
        return strg + rstr + end;
      }
    );

    // Look for a comment
    nxt = nxt.replace(
      /\/\/[^\n\r]*|\/[*](?:.|[\n\r])*?[*]\//g,
      function (str) {
        // Replace prior formatting inside
        let rstr = str.replace(
          /\0(?:prop|kywd|nmbr|regx|end|valu|mthd|oper|strg)\0/g,
          ''
        );
        // Add delimiters for comment docs (preceeded by @)
        rstr = rstr.replace(
          /[@][A-Za-z0-9_$]*/g,
          cdoc + "$&" + end
        );
        return cmnt + rstr + end;
      });

    // Return the delimited string
    return nxt;
  }

  /**
   * Replaces delimited JavaScript for highlighted HTML
   * @param {string} inStr marked-up JavaScript
   * @returns {string} raw HTML
   */
  function toHTML (inStr) {
    let rstr =  inStr.replace(
        /\0(?:prop|kywd|nmbr|regx|strg|cmnt|valu|mthd|oper|cdoc|escc)\0/g,
        insertOpenSpan
    );
    rstr = rstr.replace(/\0end\0/g, "</span>");
    return rstr;
  }

  /**
   * Highlights an HTML element's contents
   * @param {HTMLElement|string} q An Element or selector for an element
   */
  function highlight (q) {
    // Grab the element if needed
    let el = typeof q === "string" ? doc.querySelector(q) : q;
    // Markup the contents
    let m  = markupCode(el.innerHTML);
    // Finialize highlighting
    el.innerHTML = toHTML (m);
  }

  /**
   * Highlights every element with of the class "highlighted"
   */
  function highlightAll () {
    let all = doc.querySelectorAll(".highlighted");
    for (var i = all.length; i--;) {
      highlight(all[i]);
    }
  }

  // Return the library object
  win._HighLight = {
    "element": highlight,
    "all": highlightAll,
    "colors": colors,
    "markup": markupCode,
    "highlight": toHTML
  };
})();
