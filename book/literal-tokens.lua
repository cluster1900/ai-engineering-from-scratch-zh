function RawInline(inline)
  if inline.format ~= "html" then
    return nil
  end

  -- These lesson examples are literal model/document tokens, not HTML tags.
  if inline.text == "<image>"
    or inline.text == "<PERSON>"
    or inline.text:match("^<image%s+[%w_-]+>$")
    or inline.text:match("^<doc%s+[%w_-]+>$") then
    return pandoc.Str(inline.text)
  end
end
