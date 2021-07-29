const Eris = require("eris");

// Reference: https://github.com/discordjs/discord.js/blob/master/src/util/Util.js
class Util {

    /**
   * Parses emoji info out of a string. The string must be one of:
   * * A UTF-8 emoji (no id)
   * * A URL-encoded UTF-8 emoji (no id)
   * * A Discord custom emoji (`<:name:id>` or `<a:name:id>`)
   * @param {String} text Emoji string to parse
   * @returns {Eris.PartialEmoji} Object with `animated`, `name`, and `id` properties
   * @private
   */
  static parseEmoji(text) {
    if (text.includes('%')) text = decodeURIComponent(text);
    if (!text.includes(':')) return { animated: false, name: text, id: null };
    const match = text.match(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/);
    return match && { animated: Boolean(match[1]), name: match[2], id: match[3] ?? null };
  }

  /**
   * Resolves a partial emoji object from an {@link EmojiIdentifierResolvable}, without checking a Client.
   * @param {String} emoji Emoji identifier to resolve
   * @returns {Eris.PartialEmoji}
   * @private
   */
  static resolvePartialEmoji(emoji) {
    if (!emoji) return null;
    if (typeof emoji === 'string') return /^\d{17,19}$/.test(emoji) ? { id: emoji } : Util.parseEmoji(emoji);
    const { id, name, animated } = emoji;
    if (!id && !name) return null;
    return { id, name, animated };
  }

}

module.exports = Util;