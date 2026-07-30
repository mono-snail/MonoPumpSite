#!/usr/bin/env ruby

require "json"
require "net/http"
require "nokogiri"
require "uri"

ROOT = File.expand_path("..", __dir__)
PAGES = %w[index.html support.html privacy.html launch.html].freeze
TARGETS = {
  "zh-Hans" => "zh-CN",
  "zh-Hant" => "zh-TW",
  "ja" => "ja",
  "ko" => "ko",
  "fr" => "fr",
  "de" => "de",
  "es" => "es",
  "pt" => "pt",
  "ar" => "ar"
}.freeze
EXTRA_STRINGS = [
  "Website language",
  "Open navigation",
  "Close navigation"
].freeze
NO_TRANSLATION_NEEDED = [
  /\A(?:MonoPump|App Store|iOS 17\.6\+|01|02|03|→|·|support\.html)\z/,
  /\A(?:support|privacy)@monopump\.app\z/
].freeze
BRAND_REPLACEMENTS = {
  "zh-CN" => ["单泵"],
  "zh-TW" => ["單泵"],
  "ja" => ["モノポンプ"],
  "ko" => ["모노펌프"],
  "fr" => ["mono-pompe"],
  "es" => ["MonoBomba"],
  "pt" => ["Monobomba"],
  "ar" => ["المضخة الأحادية", "مضخة أحادية", "مونوبومب"]
}.freeze
MANUAL_OVERRIDES = {
  "zh-CN" => {
    "MonoPump Support" => "MonoPump 支持",
    "Notice your pulse." => "留意你的脉搏。",
    "Know the moment." => "理解此刻。",
    "One pulse estimate is a number. Context makes it a record." => "一次脉搏估测只是一个数字，情境让它成为一条记录。"
  },
  "zh-TW" => {
    "MonoPump Support" => "MonoPump 支援",
    "Notice your pulse." => "留意你的脈搏。",
    "Know the moment." => "理解此刻。",
    "One pulse estimate is a number. Context makes it a record." => "一次脈搏估測只是一個數字，情境讓它成為一筆紀錄。"
  },
  "ja" => {
    "MonoPump Support" => "MonoPump サポート",
    "Notice your pulse." => "脈拍に気づく。",
    "Know the moment." => "その瞬間を知る。",
    "One pulse estimate is a number. Context makes it a record." => "一度の脈拍推定はただの数値。状況を加えることで、意味のある記録になります。"
  },
  "ko" => {
    "MonoPump Support" => "MonoPump 지원",
    "Notice your pulse." => "맥박을 살펴보세요.",
    "Know the moment." => "그 순간을 이해하세요.",
    "One pulse estimate is a number. Context makes it a record." => "한 번의 맥박 추정치는 하나의 숫자입니다. 상황을 더하면 의미 있는 기록이 됩니다."
  },
  "fr" => {
    "MonoPump Support" => "Assistance MonoPump",
    "Notice your pulse." => "Observez votre pouls.",
    "Know the moment." => "Comprenez le contexte.",
    "One pulse estimate is a number. Context makes it a record." => "Une estimation du pouls est un chiffre. Son contexte en fait une donnée utile."
  },
  "de" => {
    "MonoPump Support" => "MonoPump-Support",
    "Notice your pulse." => "Beobachten Sie Ihren Puls.",
    "Know the moment." => "Verstehen Sie den Moment.",
    "One pulse estimate is a number. Context makes it a record." => "Eine Pulsschätzung ist eine Zahl. Der Kontext macht daraus einen aussagekräftigen Eintrag."
  },
  "es" => {
    "MonoPump Support" => "Soporte de MonoPump",
    "Notice your pulse." => "Observa tu pulso.",
    "Know the moment." => "Comprende el momento.",
    "One pulse estimate is a number. Context makes it a record." => "Una estimación del pulso es un número. El contexto la convierte en un registro útil."
  },
  "pt" => {
    "MonoPump Support" => "Suporte do MonoPump",
    "Notice your pulse." => "Observe seu pulso.",
    "Know the moment." => "Entenda o momento.",
    "One pulse estimate is a number. Context makes it a record." => "Uma estimativa de pulso é um número. O contexto a transforma em um registro útil."
  },
  "ar" => {
    "MonoPump Support" => "دعم MonoPump",
    "Notice your pulse." => "راقب نبضك.",
    "Know the moment." => "وافهم اللحظة.",
    "One pulse estimate is a number. Context makes it a record." => "تقدير النبض رقم، والسياق يحوله إلى سجل مفيد."
  }
}.freeze
MAX_BATCH_CHARACTERS = 3_200

def normalized(value)
  value.to_s.gsub(/\s+/, " ").strip
end

def source_strings
  strings = EXTRA_STRINGS.dup

  PAGES.each do |page|
    document = Nokogiri::HTML(File.read(File.join(ROOT, page)))
    document.css("script, style, noscript").remove

    document.xpath("//text()[normalize-space()]").each do |node|
      strings << normalized(node.text)
    end

    document.css("[alt], [aria-label], [title], [placeholder]").each do |element|
      %w[alt aria-label title placeholder].each do |attribute|
        strings << normalized(element[attribute]) if element.key?(attribute)
      end
    end

    document.css("meta[name='description'], meta[property='og:title'], meta[property='og:description']").each do |meta|
      strings << normalized(meta["content"])
    end
  end

  strings
    .reject(&:empty?)
    .reject { |value| NO_TRANSLATION_NEEDED.any? { |pattern| pattern.match?(value) } }
    .uniq
    .sort
end

def batches(strings)
  strings.each_with_index.each_with_object([]) do |(text, index), result|
    entry = "__MP_#{index.to_s.rjust(4, "0")}__ #{text}"
    if result.empty? || result.last.join("\n").length + entry.length + 1 > MAX_BATCH_CHARACTERS
      result << []
    end
    result.last << entry
  end
end

def request_translation(text, target, attempts: 3)
  uri = URI("https://translate.googleapis.com/translate_a/single")
  uri.query = URI.encode_www_form(
    client: "gtx",
    sl: "en",
    tl: target,
    dt: "t",
    q: text
  )

  response = Net::HTTP.get_response(uri)
  raise "Translation request failed: HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)

  JSON.parse(response.body).fetch(0).map { |segment| segment.fetch(0) }.join
rescue StandardError
  raise if attempts <= 1

  sleep(1)
  request_translation(text, target, attempts: attempts - 1)
end

def translate(strings, target)
  translated = {}

  batches(strings).each_with_index do |batch, batch_index|
    warn "#{target}: batch #{batch_index + 1}/#{batches(strings).length}"
    response = request_translation(batch.join("\n"), target)
    matches = response.scan(/__MP_(\d{4})__\s*(.*?)(?=__MP_\d{4}__|\z)/m)

    matches.each do |raw_index, value|
      index = raw_index.to_i
      source = strings.fetch(index)
      translation = normalized(value)
      if source.include?("MonoPump")
        BRAND_REPLACEMENTS.fetch(target, []).each do |variant|
          translation = translation.gsub(variant, "MonoPump")
        end
      end
      translated[source] = translation
    end
  end

  missing = strings - translated.keys
  raise "Missing #{target} translations: #{missing.join(" | ")}" unless missing.empty?

  translated.merge!(MANUAL_OVERRIDES.fetch(target, {}))
  translated
end

strings = source_strings
warn "Translating #{strings.length} source strings"

translations = TARGETS.to_h do |locale, target|
  [locale, translate(strings, target)]
end

output = <<~JAVASCRIPT
  // Generated by scripts/generate-translations.rb. English source remains in the HTML files.
  window.MONOPUMP_TRANSLATIONS = #{JSON.pretty_generate(translations)};
JAVASCRIPT

File.write(File.join(ROOT, "assets", "translations.js"), output)
warn "Wrote assets/translations.js"
