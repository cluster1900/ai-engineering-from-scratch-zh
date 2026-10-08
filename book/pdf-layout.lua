function Code(inline)
  if FORMAT ~= "latex" then
    return nil
  end
  local escaped = inline.text:gsub("([\\%%#{}%^ &$~_])", "\\%1")
  return pandoc.RawInline("latex", "\\EscVerb{" .. escaped .. "}")
end

function Table(block)
  if FORMAT ~= "latex" then
    return nil
  end
  return block:walk({
    Str = function(inline)
      if #inline.text <= 20 or inline.text:find("[^ -~]") then
        return nil
      end
      local wrapped = pandoc.List()
      for character in inline.text:gmatch(".") do
        if #wrapped > 0 then
          wrapped:insert(pandoc.RawInline("latex", "\\allowbreak{}"))
        end
        wrapped:insert(pandoc.Str(character))
      end
      return wrapped
    end,
  })
end
